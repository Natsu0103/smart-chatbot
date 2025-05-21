import openai
import os
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Connect to PostgreSQL database
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cursor = conn.cursor()

app = Flask(__name__)
CORS(app)  

# Helper function to search for FAQ answers in PostgreSQL
def get_faq_answer(question):
    cursor.execute("SELECT answer FROM faqs WHERE question ILIKE %s", (f"%{question}%",))
    result = cursor.fetchone()
    if result:
        return result[0]  
    return None 

@app.route("/ask", methods=["POST"])
def ask_question():
    try:
        data = request.get_json()
        if not data or "question" not in data:
            return jsonify({"error": "Missing 'question' parameter"}), 400

        question = data["question"].strip()

        # Check for FAQ answer
        faq_answer = get_faq_answer(question)

        if faq_answer:
            return Response(faq_answer, content_type='text/plain')  

        # If no FAQ matched, use OpenAI's API for dynamic response
        def generate_response():
            try:
                client = openai.OpenAI(api_key=openai.api_key)

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": question}],
                    stream=True
                )

                for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            
            except Exception as e:
                print("OpenAI API Error:", str(e))  # Debugging
                yield f"\n[Error] {str(e)}"

        return Response(generate_response(), content_type='text/plain')

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
