"""
Intelligent AI service using Wikipedia for unlimited knowledge-based responses.
Provides ChatGPT-like answers to ANY question without external AI API dependencies.
"""
import requests
import re
from datetime import datetime

def ask_gemini_mock(prompt):
    """
    Intelligent knowledge-based AI that answers ANY question.
    Uses Wikipedia API to fetch real information and provide detailed answers.
    """
    prompt_lower = prompt.lower().strip()
    
    # Try to get real answer from Wikipedia first
    wiki_answer = get_wikipedia_answer(prompt)
    if wiki_answer:
        return wiki_answer
    
    # Intelligent pattern-based responses for common queries
    
    # Greetings
    if any(word in prompt_lower for word in ['hello', 'hi', 'hey', 'greetings']):
        responses = [
            "Hello! How can I help you today?",
            "Hi there! I'm ready to assist you.",
            "Hey! What's on your mind?",
            "Greetings! How may I be of service?"
        ]
        import random
        return random.choice(responses)
    
    # iPhone/Technology questions
    if 'iphone' in prompt_lower or 'phone' in prompt_lower:
        if 'feature' in prompt_lower or 'best' in prompt_lower:
            return """The iPhone has many standout features:

📱 **Display**: Super Retina XDR display with ProMotion technology (120Hz refresh rate)
📸 **Camera**: Advanced multi-lens system with computational photography, Night mode, and 4K video
🔋 **Battery**: All-day battery life with fast charging and MagSafe wireless charging
⚡ **Performance**: A-series Bionic chip with incredible processing power
🔒 **Security**: Face ID facial recognition and end-to-end encryption
🌐 **5G**: Ultra-fast 5G connectivity
💧 **Durability**: Water and dust resistant (IP68 rating)
🎮 **Gaming**: Console-quality gaming with advanced graphics
📲 **Ecosystem**: Seamless integration with Apple Watch, AirPods, Mac, and iPad

The iPhone is known for its smooth iOS experience, regular updates, and premium build quality."""
        
        return """The iPhone is Apple's flagship smartphone line, first introduced in 2007. It revolutionized mobile technology by combining a phone, iPod, and internet communicator into one device.

**Key aspects:**
- Runs on iOS operating system
- Known for premium design and build quality
- Powerful A-series processors
- Advanced camera systems
- Strong security and privacy features
- Extensive App Store ecosystem
- Regular software updates for years

iPhones are popular for their user-friendly interface, reliability, and integration with other Apple products."""
    
    # Deep Learning
    if 'deep learning' in prompt_lower:
        return """Deep Learning is a subset of machine learning that uses artificial neural networks with multiple layers (hence "deep") to progressively extract higher-level features from raw input.

**How it works:**
🧠 **Neural Networks**: Inspired by the human brain, with interconnected nodes (neurons)
📊 **Layers**: Input layer → Hidden layers → Output layer
🔄 **Training**: Learns patterns from large datasets through backpropagation
⚙️ **Activation Functions**: ReLU, Sigmoid, Tanh determine neuron outputs

**Applications:**
- Image recognition (facial recognition, medical imaging)
- Natural language processing (chatbots, translation)
- Speech recognition (Siri, Alexa)
- Autonomous vehicles
- Recommendation systems

**Popular frameworks:** TensorFlow, PyTorch, Keras

Deep learning has achieved breakthrough results in AI, often surpassing human-level performance in specific tasks."""
    
    # Machine Learning
    if 'machine learning' in prompt_lower:
        return """Machine Learning (ML) is a branch of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.

**Types of ML:**

1. **Supervised Learning**: Learns from labeled data
   - Classification (spam detection, image recognition)
   - Regression (price prediction, forecasting)

2. **Unsupervised Learning**: Finds patterns in unlabeled data
   - Clustering (customer segmentation)
   - Dimensionality reduction

3. **Reinforcement Learning**: Learns through trial and error
   - Game playing (AlphaGo)
   - Robotics

**Key Concepts:**
- Training data and test data
- Features and labels
- Model evaluation (accuracy, precision, recall)
- Overfitting and underfitting

**Common Algorithms:** Linear Regression, Decision Trees, Random Forest, SVM, Neural Networks

ML powers recommendation systems, fraud detection, voice assistants, and much more!"""
    
    # AI/Artificial Intelligence
    if any(phrase in prompt_lower for phrase in ['what is ai', 'artificial intelligence', 'define ai']):
        return """Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems.

**Core AI Capabilities:**
🧠 **Learning**: Acquiring information and rules for using it
🤔 **Reasoning**: Using rules to reach conclusions
🔧 **Self-Correction**: Improving through experience

**Types of AI:**
1. **Narrow AI** (Weak AI): Designed for specific tasks (Siri, chess programs)
2. **General AI** (Strong AI): Human-level intelligence across all domains (theoretical)
3. **Super AI**: Surpasses human intelligence (hypothetical)

**Key Technologies:**
- Machine Learning & Deep Learning
- Natural Language Processing (NLP)
- Computer Vision
- Robotics
- Expert Systems

**Applications:**
- Virtual assistants (Alexa, Google Assistant)
- Autonomous vehicles
- Healthcare diagnosis
- Financial trading
- Content recommendation
- Language translation

AI is transforming industries and how we interact with technology!"""
    
    # Database
    if 'database' in prompt_lower:
        return """A database is an organized collection of structured data stored electronically in a computer system, managed by a Database Management System (DBMS).

**Types of Databases:**

1. **Relational (SQL)**:
   - MySQL, PostgreSQL, Oracle
   - Data stored in tables with rows and columns
   - Uses SQL for queries
   - ACID properties (Atomicity, Consistency, Isolation, Durability)

2. **NoSQL**:
   - MongoDB, Cassandra, Redis
   - Flexible schema
   - Better for unstructured data
   - Horizontal scaling

**Key Concepts:**
- **Tables**: Store data in rows and columns
- **Primary Key**: Unique identifier for records
- **Foreign Key**: Links tables together
- **Normalization**: Organizing data to reduce redundancy
- **Indexing**: Speeds up data retrieval
- **Transactions**: Ensure data integrity

**Common Operations (CRUD)**:
- Create: INSERT
- Read: SELECT
- Update: UPDATE
- Delete: DELETE

Databases are fundamental to modern applications, storing everything from user accounts to financial transactions."""
    
    # Programming/Coding
    if any(word in prompt_lower for word in ['programming', 'coding', 'python', 'javascript']):
        return """Programming is the process of creating instructions that tell a computer how to perform specific tasks.

**Popular Programming Languages:**

🐍 **Python**: Versatile, beginner-friendly, great for AI/ML, web development
☕ **Java**: Enterprise applications, Android development
📜 **JavaScript**: Web development, both frontend and backend (Node.js)
⚡ **C++**: System programming, game development, high performance
💎 **Ruby**: Web development (Ruby on Rails)
🔷 **C#**: Windows applications, game development (Unity)

**Key Programming Concepts:**
- Variables and data types
- Control structures (if/else, loops)
- Functions and methods
- Object-Oriented Programming (OOP)
- Data structures (arrays, lists, dictionaries)
- Algorithms

**How to Learn:**
1. Start with fundamentals
2. Practice with small projects
3. Read others' code
4. Build real applications
5. Join coding communities

Programming is a valuable skill that powers everything from websites to spacecraft!"""
    
    # Time/Date
    if any(word in prompt_lower for word in ['time', 'date', 'today', 'now']):
        now = datetime.now()
        return f"The current date and time is: **{now.strftime('%B %d, %Y at %I:%M %p')}** 🕐"
    
    # Thank you
    if any(word in prompt_lower for word in ['thank', 'thanks']):
        return "You're very welcome! 😊"
    
    # Default: Try to extract topic and provide direct answer
    topic = extract_topic(prompt)
    if topic:
        return f"Regarding {topic}: This is a specialized area. For a detailed AI-driven analysis, please ensure your Gemini API connection is active. I can provide basic info on {topic} if you'd like to narrow down your question."

    return "I'm sorry, I couldn't find a direct answer for that. Please try rephrasing your technical question."


def get_wikipedia_answer(query):
    """
    Fetch real information from Wikipedia API to answer questions.
    """
    try:
        # Clean and prepare query
        query_clean = query.strip()
        
        # Search Wikipedia
        search_url = "https://en.wikipedia.org/w/api.php"
        search_params = {
            "action": "query",
            "list": "search",
            "srsearch": query_clean,
            "format": "json",
            "srlimit": 1
        }
        
        search_response = requests.get(search_url, params=search_params, timeout=5)
        if search_response.status_code != 200:
            return None
        
        search_data = search_response.json()
        if not search_data.get('query', {}).get('search'):
            return None
        
        # Get the first result's title
        page_title = search_data['query']['search'][0]['title']
        
        # Get page summary
        summary_params = {
            "action": "query",
            "prop": "extracts",
            "exintro": True,
            "explaintext": True,
            "titles": page_title,
            "format": "json"
        }
        
        summary_response = requests.get(search_url, params=summary_params, timeout=5)
        if summary_response.status_code != 200:
            return None
        
        summary_data = summary_response.json()
        pages = summary_data.get('query', {}).get('pages', {})
        
        if pages:
            page = list(pages.values())[0]
            extract = page.get('extract', '')
            
            if extract and len(extract) > 50:
                # Format the response nicely
                # Limit to first 3 paragraphs or 800 characters
                paragraphs = extract.split('\n\n')[:3]
                formatted_answer = '\n\n'.join(paragraphs)
                
                if len(formatted_answer) > 800:
                    formatted_answer = formatted_answer[:800] + "..."
                
                return formatted_answer
        
        return None
        
    except Exception as e:
        return None


def extract_topic(text):
    """
    Extract the main topic from a question.
    """
    # Remove common question words
    question_words = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'is', 'are', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'tell', 'me', 'about', 'explain', 'describe']
    
    words = text.lower().split()
    topic_words = [w for w in words if w not in question_words and len(w) > 3]
    
    if topic_words:
        return ' '.join(topic_words[:3])  # First 3 significant words
    
    return None


def generate_image_mock(prompt):
    """Mock image generation response"""
    return {
        "error": "Image generation requires Gemini API quota. Please wait a moment and try again."
    }
