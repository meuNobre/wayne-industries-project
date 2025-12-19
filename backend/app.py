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

@app.route('/resource/<int:resource_id>', methods=['PUT'])
def update_resource(resource_id):

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

    status = data.get('status', 'active')  # Default para 'active' se não fornecido
    
    cursor.execute(
        "UPDATE resources SET name = %s, description = %s, status = %s WHERE id = %s",
        (data['name'], data.get('description'), status, resource_id)
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Resource updated"}), 200


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

@app.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Retorna estatísticas para o dashboard:
    - Total de recursos
    - Total de usuários
    - Recursos ativos
    - Recursos por status
    - Usuários por role
    - Atividades recentes
    """
    
    user_id = request.headers.get('X-User-Id')
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    conn = db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Total de recursos
        cursor.execute("SELECT COUNT(*) as total FROM resources")
        total_resources = cursor.fetchone()['total']
        
        # 2. Total de usuários
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']
        
        # 3. Recursos ativos (status = 'active')
        cursor.execute("SELECT COUNT(*) as total FROM resources WHERE status = 'active'")
        active_resources = cursor.fetchone()['total']
        
        # 4. Recursos por status (para o gráfico)
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM resources 
            GROUP BY status
        """)
        resources_by_status = cursor.fetchall()
        
        # 5. Usuários por role
        cursor.execute("""
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        """)
        users_by_role = cursor.fetchall()
        
        # 6. Últimas atividades (últimos 5 recursos criados)
        cursor.execute("""
            SELECT id, name, description, create_at 
            FROM resources 
            ORDER BY create_at DESC 
            LIMIT 5
        """)
        recent_activities = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Retorna todas as estatísticas
        return jsonify({
            "total_resources": total_resources,
            "total_users": total_users,
            "active_resources": active_resources,
            "resources_by_status": resources_by_status,
            "users_by_role": users_by_role,
            "recent_activities": recent_activities
        }), 200
        
    except Exception as e:
        cursor.close()
        conn.close()
        print(f"Erro ao buscar estatísticas: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)
