from dotenv import load_dotenv
import os
import glob
from google.genai import types
from google import genai 




def generate_technical_spec_from_code():
    """
    Reads a Python source file from the 'code' directory, and uses the Gemini API 
    to generate a detailed technical specification in Markdown format.
    """
    try:
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Error: GEMINI_API_KEY not found. Please create a .env file and add your API key.")
            return

        # Dynamically find the first Python file in the 'code' directory
        code_dir = os.path.join(os.path.dirname(__file__), 'code')
        py_files = glob.glob(os.path.join(code_dir, '*.py'))
        
        if not py_files:
            print(f"Error: No Python source code file found in '{code_dir}'")
            return
            
        source_code_path = py_files[0] # Use the first .py file found

        try:
            with open(source_code_path, 'r', encoding='utf-8') as f:
                source_code = f.read()
        except FileNotFoundError:
            # This case is less likely now with glob, but good for safety
            print(f"Error: Source code file not found at {source_code_path}")
            return

        client = genai.Client(api_key=api_key)
        model = "gemini-2.5-pro-preview-06-05"
        
        # Updated prompt to generate a detailed technical specification
        prompt = f"""
        As a principal software architect, your task is to generate a detailed technical specification document in Markdown format based on the provided Python source code.

        The specification must cover the following sections:
        1.  **System Overview:** A high-level description of the system's purpose and architecture.
        2.  **Agent Definitions:** A detailed breakdown of each agent, including:
            *   Agent Name and Type (e.g., SequentialAgent, ParallelAgent).
            *   Responsibilities and Goals.
            *   Required Tools (including mocked functions and third-party APIs).
            *   LLM Model used.
        3.  **Workflow and Data Flow:** A description of the end-to-end process orchestration, explaining how the agents interact and how data (state) is passed between them.
        4.  **State Management:** An explanation of how the session state is used for communication and data persistence throughout the workflow, listing the key state variables.
        5.  **Configuration and Security:** Mention how secrets (like API keys) are managed.

        Here is the source code:
        ---
        {source_code}
        ---

        Generate the complete technical specification document in valid Markdown format.
        """
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]
        
        print(f"Generating technical specification from '{os.path.basename(source_code_path)}' with {model}...")

        # Collect the full response to save it to a file
        response_chunks = client.models.generate_content_stream(
            model=model,
            contents=contents,
        )

        full_response = "".join(chunk.text for chunk in response_chunks)

        # Save the specification to a file
        output_filename = "technical_spec_generated.md"
        with open(output_filename, "w", encoding='utf-8') as f:
            f.write(full_response)

        print(f"\nSuccessfully generated and saved the technical specification to '{output_filename}'.")
        return full_response

    except Exception as e:
        print(f"An error occurred while generating technical specification: {e}")
        return None
