# Standard library imports
import asyncio
import datetime
import os
import time
import uuid

# Third-party imports
from dotenv import load_dotenv
from google.adk.agents import LoopAgent
from google.adk.agents import Agent, LlmAgent, SequentialAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search

load_dotenv() # Moved load_dotenv() to be earlier








# 2. Defina os agentes especializados com descrições claras para roteamento dinâmico

research_specialist = LlmAgent(
    name="research_specialist",
    model="gemini-2.5-flash",
    instruction="""You are a research specialist. Your role is to:
    1. Analyze the user's query to understand what information is needed
    2. Use Google search to find relevant, up-to-date information
    3. Synthesize findings into a comprehensive research summary
    4. Provide sources and verify information accuracy
    
    Use the ReACT framework: Reason about what to search, Act by searching, Observe results, and iterate as needed.""",
    tools=[google_search],
    description="Specializes in researching topics, finding current information, and fact-checking using web search"
)

content_analyst = LlmAgent(
    name="content_analyst",
    model="gemini-2.5-flash",
    instruction="""You are a content analyst. Your role is to:
    1. Analyze existing content for structure, clarity, and completeness
    2. Identify gaps, inconsistencies, or areas for improvement
    3. Provide detailed feedback and suggestions
    4. Evaluate content against best practices and standards
    
    Focus on constructive analysis that helps improve content quality.""",
    description="Analyzes content quality, structure, and provides detailed feedback for improvement"
)

creative_writer = LlmAgent(
    name="creative_writer",
    model="gemini-2.5-flash",
    instruction="""You are a creative writer. Your role is to:
    1. Create engaging, well-structured content from scratch
    2. Adapt writing style to match the intended audience and purpose
    3. Ensure content is clear, compelling, and informative
    4. Use creative techniques to make content more engaging
    
    Focus on creating original, high-quality written content.""",
    description="Creates original content, articles, and written materials with engaging and clear style"
)

technical_expert = LlmAgent(
    name="technical_expert",
    model="gemini-2.5-flash",
    instruction="""You are a technical expert. Your role is to:
    1. Provide detailed technical explanations and solutions
    2. Break down complex concepts into understandable parts
    3. Offer practical implementation guidance
    4. Ensure technical accuracy and best practices
    
    Focus on providing clear, actionable technical guidance.""",
    description="Handles technical questions, provides detailed explanations, and offers implementation guidance"
)

content_refiner = LlmAgent(
    name="content_refiner",
    model="gemini-2.5-flash",
    instruction="""You are a content refiner. Your role is to:
    1. Take existing content and improve it based on feedback
    2. Enhance clarity, flow, and readability
    3. Fix any issues or gaps identified in the content
    4. Maintain the original intent while improving quality
    
    Focus on polishing and perfecting content to meet high standards.""",
    description="Refines and improves existing content based on feedback and quality standards"
)

# 3. Crie o agente coordenador com roteamento dinâmico
root_agent = LlmAgent(
    name="intelligent_coordinator",
    model="gemini-2.5-flash",
    sub_agents=[research_specialist, content_analyst, creative_writer, technical_expert, content_refiner],
    instruction="""You are an intelligent coordinator that routes user requests to the most appropriate specialist agent.

Analyze the user's request and determine which agent can best handle it:

- **research_specialist**: For questions requiring current information, fact-checking, or web research
  Examples: "What's the latest news about...", "Find information about...", "Research the current state of..."

- **content_analyst**: For analyzing existing content, providing feedback, or evaluating quality
  Examples: "Review this document", "Analyze this content", "What's wrong with this text..."

- **creative_writer**: For creating original content, articles, or creative writing tasks
  Examples: "Write an article about...", "Create content for...", "Draft a blog post..."

- **technical_expert**: For technical questions, programming help, or implementation guidance
  Examples: "How do I implement...", "Explain this technical concept", "Help me debug..."

- **content_refiner**: For improving existing content based on feedback or requirements
  Examples: "Improve this text", "Refine this content", "Make this better..."

Use transfer_to_agent() to route to the appropriate specialist. If the request is complex and might benefit from multiple agents, start with the most relevant one and they can transfer to others if needed.

If you're unsure which agent to use, default to research_specialist for information gathering or creative_writer for content creation.""",
    description="Intelligently routes user requests to the most appropriate specialist agent based on the nature of the query"
)
