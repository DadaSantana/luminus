import os
import glob
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

def generate_diagram_from_code():
    """
    Reads a Python source file from the 'code' directory and uses the Gemini API 
    to generate an architecture diagram in Mermaid format.
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
            print(f"Error: Source code file not found at {source_code_path}")
            return

        client = genai.Client(api_key=api_key)
        model = "gemini-2.5-pro-preview-06-05"
        
        # Prompt to generate a Mermaid diagram from the source code
        # Prompt to generate a Mermaid diagram from the source code
        prompt = f"""
        Create a Mermaid flowchart from the Python code below. Follow these STRICT syntax rules:

        MANDATORY SYNTAX RULES:
        1. Line 1: ```mermaid
        2. Line 2: flowchart TD
        3. Lines 3+: Node definitions and connections ONLY
        4. Last line: ```

        NODE SYNTAX (choose ONE format per node):
        - Simple: A[Text Here]
        - Start/End: A([Text Here])
        - Decision: A{{Text Here}}
        - Process: A[Text Here]

        CONNECTION SYNTAX:
        - Simple: A --> B
        - With label: A -->|label| B

        CRITICAL CONSTRAINTS:
        - Node IDs: Use only letters and numbers (A, B, C1, Node1, etc.)
        - No spaces in node IDs
        - No special characters in node IDs except letters/numbers
        - Each statement on separate line
        - No comments or extra text
        - No dashes in node labels that could break parsing

        Code to analyze:
        ---
        {source_code}
        ---

        Create a diagram showing:
        1. Main entry point
        2. Key functions/methods
        3. Decision points
        4. Data flow
        5. End points

        EXAMPLE CORRECT FORMAT:
        ```mermaid
        flowchart TD
            A([Start])
            B[Initialize System]
            C[Process Data]
            D{{Has Data}}
            E[Execute Task]
            F[Handle Error]
            G([End])
            
            A --> B
            B --> C
            C --> D
            D --> E
            D --> F
            E --> G
            F --> G
        OUTPUT: Only the mermaid code block. No explanations. No extra text.
        """
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]
        
        print(f"Generating diagram from '{os.path.basename(source_code_path)}' with {model}...")

        response_chunks = client.models.generate_content_stream(
            model=model,
            contents=contents,
        )

        full_response = "".join(chunk.text for chunk in response_chunks)

        # Extract the Mermaid code from the response block
        mermaid_code = full_response
        if "```mermaid" in mermaid_code:
            match = re.search(r"```mermaid(.*)```", mermaid_code, re.DOTALL)
            if match:
                mermaid_code = match.group(1).strip()
        elif "```" in mermaid_code:
             mermaid_code = mermaid_code.replace("```", "").strip()

        # Save the diagram to a file
        output_filename = "architecture.md"
        with open(output_filename, "w", encoding='utf-8') as f:
            f.write("```mermaid\n")
            f.write(mermaid_code)
            f.write("\n```")

        print(f"\nSuccessfully generated and saved the architecture diagram to '{output_filename}'.")

    except Exception as e:
        print(f"An error occurred: {e}")

