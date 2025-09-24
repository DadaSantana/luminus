import os
import json
from typing import Optional
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Carrega variáveis do .env (se existir)
load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase is already initialized
        firebase_admin.get_app()
        print("Firebase already initialized")
    except ValueError:
        project_id = os.getenv("FIREBASE_PROJECT_ID", "luminus-aca84")
        
        try:
            # Tentar usar service account se disponível
            sa_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH") or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            
            if sa_json_str:
                sa_info = json.loads(sa_json_str)
                cred = credentials.Certificate(sa_info)
                firebase_admin.initialize_app(cred, {"projectId": project_id})
                print("Firebase initialized with service account JSON from env")
            elif sa_path and os.path.exists(sa_path):
                # Verificar se o arquivo tem credenciais válidas
                with open(sa_path, 'r') as f:
                    sa_content = json.load(f)
                    if sa_content.get('private_key') and 'PLACEHOLDER' not in sa_content.get('private_key', ''):
                        cred = credentials.Certificate(sa_path)
                        firebase_admin.initialize_app(cred, {"projectId": project_id})
                        print(f"Firebase initialized with service account file: {sa_path}")
                    else:
                        raise ValueError("Service account file contains placeholder values")
            else:
                # Tentar Application Default Credentials
                try:
                    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, {"projectId": project_id})
                    print(f"Firebase initialized with ADC and project ID: {project_id}")
                except Exception as adc_error:
                    print(f"ADC failed: {adc_error}")
                    # Último fallback: inicializar sem credenciais (modo emulador)
                    firebase_admin.initialize_app(options={"projectId": project_id})
                    print(f"Firebase initialized in emulator mode with project ID: {project_id}")
                    
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
            # Fallback final: modo emulador
            try:
                firebase_admin.initialize_app(options={"projectId": project_id})
                print(f"Firebase initialized in fallback mode with project ID: {project_id}")
            except Exception as final_error:
                print(f"Complete Firebase initialization failure: {final_error}")
                return None

    try:
        client = firestore.client()
        # Testar conexão
        test_doc = client.collection('test').document('connection')
        test_doc.set({'timestamp': firestore.SERVER_TIMESTAMP, 'status': 'connected'})
        print("Firestore connection test successful")
        return client
    except Exception as e:
        print(f"Firestore connection failed: {e}")
        return None

# Get Firestore client
def get_firestore_client():
    """Get Firestore client instance"""
    try:
        return firestore.client()
    except Exception as e:
        print(f"Error getting Firestore client: {e}")
        return None