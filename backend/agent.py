from anthropic import Anthropic, AuthenticationError, RateLimitError, APIConnectionError  # pyright: ignore[reportMissingImports]
import os
from typing import List, Dict, Any


class AgentExecutor:
    """Executes AI agent tasks using Claude API with tool support"""

    def __init__(self, agent_config: Dict):
        self.agent_config = agent_config
        self.client = anthropic.Anthropic(  # pyright: ignore[reportUndefinedVariable]
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )

        # ── Available Tools ──────────────────────────────────
        self.tools = [
            {
                "name": "calculator",
                "description": "Performs basic arithmetic. Use when asked to calculate numbers.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["add", "subtract", "multiply", "divide"],
                            "description": "The arithmetic operation to perform"
                        },
                        "a": {
                            "type": "number",
                            "description": "First number"
                        },
                        "b": {
                            "type": "number",
                            "description": "Second number"
                        }
                    },
                    "required": ["operation", "a", "b"]
                }
            },
            {
                "name": "get_current_time",
                "description": "Returns the current date and time.",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "word_counter",
                "description": "Counts words in a given text.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "The text to count words in"
                        }
                    },
                    "required": ["text"]
                }
            }
        ]

    def execute_tool(self, tool_name: str, tool_input: Dict) -> str:
        """Execute a tool and return its result as a string"""

        if tool_name == "calculator":
            try:
                op  = tool_input.get("operation")
                a   = float(tool_input.get("a", 0))
                b   = float(tool_input.get("b", 0))

                if op == "add":
                    result = a + b
                elif op == "subtract":
                    result = a - b
                elif op == "multiply":
                    result = a * b
                elif op == "divide":
                    if b == 0:
                        return "Error: Cannot divide by zero"
                    result = a / b
                else:
                    return f"Error: Unknown operation '{op}'"

                # Format nicely (remove .0 for whole numbers)
                if result == int(result):
                    return str(int(result))
                return str(round(result, 6))

            except Exception as e:
                return f"Calculator error: {str(e)}"

        elif tool_name == "get_current_time":
            from datetime import datetime
            now = datetime.now()
            return now.strftime("Current date: %A, %B %d, %Y | Time: %I:%M %p")

        elif tool_name == "word_counter":
            text = tool_input.get("text", "")
            word_count   = len(text.split())
            char_count   = len(text)
            char_no_space = len(text.replace(" ", ""))
            return (
                f"Word count: {word_count} words | "
                f"Characters (with spaces): {char_count} | "
                f"Characters (no spaces): {char_no_space}"
            )

        return f"Error: Tool '{tool_name}' not found"

    async def run(self, messages: List[Dict]) -> Dict[str, Any]:
        """
        Run the agent with the given message history.
        Returns the assistant's response with optional tool usage info.
        """

        # Build system prompt from agent config
        system_prompt = f"""You are {self.agent_config['name']}, {self.agent_config['role']}.

{self.agent_config['instructions']}

You have access to tools that you can use when needed. 
Always use tools when performing calculations or getting current information.
Be helpful, clear, and concise in your responses."""

        try:
            # ── First API Call ───────────────────────────────
            response = self.client.messages.create(
                model=self.agent_config.get("model", "claude-sonnet-4-20250514"),
                max_tokens=2048,
                system=system_prompt,
                messages=messages,
                tools=self.tools
            )

            # ── Handle Tool Use ──────────────────────────────
            if response.stop_reason == "tool_use":

                # Find the tool_use block
                tool_use_block = None
                for block in response.content:
                    if block.type == "tool_use":
                        tool_use_block = block
                        break

                if tool_use_block:
                    # Execute the tool
                    tool_result = self.execute_tool(
                        tool_use_block.name,
                        tool_use_block.input
                    )

                    # Add assistant's response + tool result to messages
                    messages_with_tool = messages + [
                        {
                            "role": "assistant",
                            "content": response.content
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "tool_result",
                                    "tool_use_id": tool_use_block.id,
                                    "content": tool_result
                                }
                            ]
                        }
                    ]

                    # ── Second API Call (after tool result) ──
                    final_response = self.client.messages.create(
                        model=self.agent_config.get("model", "claude-sonnet-4-20250514"),
                        max_tokens=2048,
                        system=system_prompt,
                        messages=messages_with_tool,
                        tools=self.tools
                    )

                    # Extract text from final response
                    final_text = ""
                    for block in final_response.content:
                        if hasattr(block, "text"):
                            final_text = block.text
                            break

                    return {
                        "content": final_text,
                        "tool_used": tool_use_block.name,
                        "tool_input": tool_use_block.input,
                        "tool_result": tool_result
                    }

            # ── No Tool Used - Return Direct Response ────────
            text_content = ""
            for block in response.content:
                if hasattr(block, "text"):
                    text_content = block.text
                    break

            return {
                "content": text_content,
                "tool_used": None,
                "tool_input": None,
                "tool_result": None
            }
        except AuthenticationError:
            raise Exception(
                "Invalid Anthropic API key. Please check your .env file."
            )
        except RateLimitError:
            raise Exception(
                "Anthropic API rate limit reached. Please try again later."
            )
        except APIConnectionError:
            raise Exception(
                "Cannot connect to Anthropic API. Check your internet connection."
            )


        # except anthropic.AuthenticationError:  # pyright: ignore[reportUndefinedVariable]
        #     raise Exception(
        #         "Invalid Anthropic API key. Please check your .env file and make sure "
        #         "ANTHROPIC_API_KEY is set to a valid key from https://console.anthropic.com/"
        #     )
        # except anthropic.RateLimitError:  # pyright: ignore[reportUndefinedVariable]
        #     raise Exception(
        #         "Anthropic API rate limit reached. Please wait a moment and try again."
        #     )
        # except anthropic.APIConnectionError:  # pyright: ignore[reportUndefinedVariable]
        #     raise Exception(
        #         "Cannot connect to Anthropic API. Please check your internet connection."
        #     )
        # except Exception as e:
        #     raise Exception(f"Agent execution error: {str(e)}")