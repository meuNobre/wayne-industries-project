from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_db_connection as db;

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"status": "Database is running"})

@app.route('/login', methods=['POST'])
def login():

    data = request.json

    conn = db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute(
            "SELECT id, username, role FROM users WHERE username=%s AND password=%s",
            (data["username"], data["password"])
        )    
    
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify(user)

@app.route('/resources', methods=['GET'])
def get_resources():

    user_id = request.headers.get('X-User-Id')

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    conn = db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT role FROM users WHERE id=%s", (user_id,))

    user = cursor.fetchone()
    if not user:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 403
    
    cursor.execute("SELECT * FROM resources")
    resources = cursor.fetchall()   

    cursor.close()
    conn.close()

    return jsonify(resources)

@app.route('/resources', methods=['POST'])
def create_resource():

    user_id = request.headers.get('X-User-Id')

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    data = request.json

    conn = db()
    cursor = conn.cursor(dictionary=True)

    # verifica role do usuário
    cursor.execute(
        "SELECT role FROM users WHERE id = %s",
        (user_id,)
    )
    user = cursor.fetchone()

    if not user or user['role'] not in ['manager', 'admin']:
        cursor.close()
        conn.close()
        return jsonify({"error": "Permission denied"}), 403

    # cria o recurso
    cursor.execute(
        "INSERT INTO resources (name, description) VALUES (%s, %s)",
        (data['name'], data.get('description'))
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Resource created"}), 201

@app.route('/resource/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):

    user_id = request.headers.get('X-User-Id')

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    conn = db()
    cursor = conn.cursor(dictionary=True)

    # verifica role do usuário
    cursor.execute(
        "SELECT role FROM users WHERE id = %s",
        (user_id,)
    )
    user = cursor.fetchone()

    if not user or user['role'] not in ['admin']:
        cursor.close()
        conn.close()
        return jsonify({"error": "Permission denied"}), 403

    # deleta o recurso
    cursor.execute("DELETE FROM resources WHERE id = %s", (resource_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Resource deleted"}), 200

if __name__ == '__main__':
    app.run(debug=True)