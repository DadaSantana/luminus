from fastapi import FastAPI, APIRouter, HTTPException
from models import WeatherTimeRequest, WeatherTimeResponse
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from agentes.agent import root_agent
from google.genai import types
import json
import re
import uuid
from contextlib import asynccontextmanager

# SQLlite DB init
DB_URL = "sqlite:///./multi_agent_data.db"
APP_NAME = "WeatherTimeProcessor"

# Create a lifespan event to initialize and clean up the session service
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    print("Application starting up...")    
    # Initialize the DatabaseSessionService instance and store it in app.state
    try:
        app.state.session_service =DatabaseSessionService(db_url=DB_URL)
        print("Database session service initialized successfully.")
    except Exception as e:
        print("Database session service initialized failed.")
        print(e)
    
    yield # This is where the application runs, handling requests
    # Shutdown code
    print("Application shutting down...")
    
# FastAPI application setup
app = FastAPI(
    title="Weather Time Processor",
    description="Multi-agent system for processing weather and time queries",
    version="1.0.0",
    lifespan=lifespan,
)

router = APIRouter()

@router.post("/process-query", response_model=WeatherTimeResponse)
async def process_weather_time_query(
    request_body: WeatherTimeRequest
):
    """
    Endpoint to interact with the weather and time agent system.
    request_body: {"query": "What's the weather like in New York?"}
    """
    # Extract query from request
    user_query = request_body.query
    
    # Generate unique IDs for this processing session
    unique_id = str(uuid.uuid4())
    session_id = unique_id
    user_id = unique_id

    try:
         # Get database session service from application state
        session_service: DatabaseSessionService = app.state.session_service
        
        # Try to get existing session or create new one
        current_session = None
        try:
            current_session = await session_service.get_session(
                app_name=APP_NAME,
                user_id = user_id,
                session_id=session_id,
            )
        except Exception as e:
            print(f"Existing Session retrieval failed for session_id='{session_id}' "
                    f"and user_uid='{user_id}': {e}")
        
        # If no session found, creating new session
        if current_session is None:
            current_session = await session_service.create_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
            )
        else:
            print(f"Existing session '{session_id}'has been found. Resuming session.")

        # Initialize the ADK Runner with our agent
        runner = Runner(
            app_name=APP_NAME,
            agent=root_agent,
            session_service = session_service,
        )


         # Format the user query as a structured message using the google genais content types
        user_message = types.Content(
            role="user", parts=[types.Part.from_text(text=user_query)]
        )
        
        # Run the agent asynchronously
        events = runner.run_async(
            user_id = user_id,
            session_id = session_id,
            new_message = user_message,
        )

        # Process events to find the final response 
        final_response = None
        last_event_content = None
        async for event in events:
            if event.is_final_response():
                if event.content and event.content.parts:
                    last_event_content = event.content.parts[0].text

        if last_event_content:
            final_response = last_event_content
        else:
            print("No final response event found from the Agent.")
    
        # Check if we got a response
        if final_response is None:
            raise HTTPException(status_code=500, detail="No response received from agent.")
        
        # Return the response using your Pydantic model
        return WeatherTimeResponse(
            original_query=user_query,
            response=final_response,
            status="success"
        )
               
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process agent query: {e}")
    
# Include the router in the FastAPI app
app.include_router(router, prefix="/api", tags=["Weather Time Processing"])