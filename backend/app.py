from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_db_connection as db;

app = Flask(__name__)
from flask_cors import CORS

CORS(
    app,
    resources={r"/*": {"origins": [
        "https://wayne-industries-project.vercel.app",
        "http://127.0.0.1:5500"
    ]}},
    supports_credentials=True,
    allow_headers=["Content-Type", "X-User-Id"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        resp = app.make_default_options_response()
        return resp



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

@app.route('/users', methods=['GET'])
def get_users():
    user_id = request.headers.get('X-User-Id')

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    conn = db()
    cursor = conn.cursor(dictionary=True)
    
    # Verifica se é admin
    cursor.execute("SELECT role FROM users WHERE id=%s", (user_id,))
    user = cursor.fetchone()
    
    if not user or user['role'] != 'admin':
        cursor.close()
        conn.close()
        return jsonify({"error": "Permission denied"}), 403
    
    # Busca todos os usuários
    cursor.execute("SELECT id, username, role, created_at FROM users")
    users = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(users)

@app.route('/users', methods=['POST'])
def create_user():
    user_id = request.headers.get('X-User-Id')

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    data = request.json

    conn = db()
    cursor = conn.cursor(dictionary=True)

    # Verifica se é admin
    cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()

    if not user or user['role'] != 'admin':
        cursor.close()
        conn.close()
        return jsonify({"error": "Permission denied"}), 403

    # Verifica se o usuário já existe
    cursor.execute("SELECT id FROM users WHERE username = %s", (data['username'],))
    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        conn.close()
        return jsonify({"error": "Username already exists"}), 400

    # Cria o novo usuário
    cursor.execute(
        "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
        (data['username'], data['password'], data['role'])
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "User created successfully"}), 201

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """
    Deleta um usuário pelo ID
    Apenas admin pode deletar
    Não pode deletar a si mesmo
    """
    admin_id = request.headers.get('X-User-Id')
    
    if not admin_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    # Não pode deletar a si mesmo
    if int(admin_id) == user_id:
        return jsonify({"error": "Cannot delete yourself"}), 400
    
    conn = db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verifica se é admin
        cursor.execute("SELECT role FROM users WHERE id = %s", (admin_id,))
        admin = cursor.fetchone()
        
        if not admin or admin['role'] != 'admin':
            cursor.close()
            conn.close()
            return jsonify({"error": "Permission denied. Admin only"}), 403
        
        # Verifica se o usuário a deletar existe
        cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
        user_to_delete = cursor.fetchone()
        
        if not user_to_delete:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        # Deleta o usuário
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "User deleted successfully",
            "deleted_user": user_to_delete['username']
        }), 200
        
    except Exception as e:
        cursor.close()
        conn.close()
        print(f"Erro ao deletar usuário: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    admin_id = request.headers.get('X-User-Id')
    if not admin_id:
        return jsonify({"error": "User not authenticated"}), 401

    data = request.json
    conn = db()
    cursor = conn.cursor(dictionary=True)

    # verifica se o usuário é admin
    cursor.execute("SELECT role FROM users WHERE id=%s", (admin_id,))
    admin = cursor.fetchone()
    if not admin or admin['role'] != 'admin':
        cursor.close()
        conn.close()
        return jsonify({"error": "Permission denied"}), 403

    # verifica se o usuário existe
    cursor.execute("SELECT id FROM users WHERE id=%s", (user_id,))
    existing_user = cursor.fetchone()
    if not existing_user:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    # atualiza dados
    fields = ["username", "role", "password"]
    updates = []
    values = []
    for f in fields:
        if f in data:
            updates.append(f"{f}=%s")
            values.append(data[f])
    values.append(user_id)

    cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id=%s", values)
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "User updated successfully"}), 200


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

    cursor.execute(
        "INSERT INTO resources (name, description) VALUES (%s, %s)",
        (data['name'], data.get('description'))
    )
    resource_id = cursor.lastrowid
    
    # Registra log de criação
    cursor.execute(
        "INSERT INTO activity_logs (resource_id, resource_name, action, user_id) VALUES (%s, %s, %s, %s)",
        (resource_id, data['name'], 'created', user_id)
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

    cursor.execute(
        "SELECT name, description, status FROM resources WHERE id = %s",
        (resource_id,)
    )
    old_resource = cursor.fetchone()

    status = data.get('status', 'active')
    
    cursor.execute(
        "UPDATE resources SET name = %s, description = %s, status = %s WHERE id = %s",
        (data['name'], data.get('description'), status, resource_id)
    )
    conn.commit()

    # Log de mudança de status
    if old_resource and old_resource['status'] != status:
        cursor.execute(
            "INSERT INTO activity_logs (resource_id, resource_name, action, old_status, new_status, user_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (resource_id, data['name'], 'status_change', old_resource['status'], status, user_id)
        )
        conn.commit()
    
    # Log de mudança de nome
    if old_resource and old_resource['name'] != data['name']:
        cursor.execute(
            "INSERT INTO activity_logs (resource_id, resource_name, action, old_value, new_value, user_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (resource_id, data['name'], 'name_change', old_resource['name'], data['name'], user_id)
        )
        conn.commit()
    
    # Log de mudança de descrição
    if old_resource and old_resource['description'] != data.get('description'):
        cursor.execute(
            "INSERT INTO activity_logs (resource_id, resource_name, action, old_value, new_value, user_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (resource_id, data['name'], 'description_change', old_resource.get('description', ''), data.get('description', ''), user_id)
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

    cursor.execute("SELECT name FROM resources WHERE id = %s", (resource_id,))
    resource = cursor.fetchone()
    
    if resource:
        # Registra log de exclusão
        cursor.execute(
            "INSERT INTO activity_logs (resource_id, resource_name, action, user_id) VALUES (%s, %s, %s, %s)",
            (resource_id, resource['name'], 'deleted', user_id)
        )
        conn.commit()
    
    # deleta o recurso
    cursor.execute("DELETE FROM resources WHERE id = %s", (resource_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Resource deleted"}), 200

@app.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Retorna estatísticas para o dashboard
    """
    
    user_id = request.headers.get('X-User-Id')
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    period = request.args.get('period', 'all')
    
    conn = db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Total de recursos
        cursor.execute("SELECT COUNT(*) as total FROM resources")
        total_resources = cursor.fetchone()['total']
        
        # 2. Total de usuários
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']
        
        # 3. Recursos ativos
        cursor.execute("SELECT COUNT(*) as total FROM resources WHERE status = 'active'")
        active_resources = cursor.fetchone()['total']
        
        # 4. Recursos por status
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
        
        # Verificar se a tabela existe primeiro
        cursor.execute("""
            SELECT COUNT(*) as table_exists 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'activity_logs'
        """)
        
        table_exists = cursor.fetchone()['table_exists'] > 0
        
        if table_exists:
            period_filter = ""
            if period == '1hour':
                period_filter = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)"
            elif period == '3days':
                period_filter = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)"
            elif period == '7days':
                period_filter = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
            elif period == '30days':
                period_filter = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            
            cursor.execute(f"""
                SELECT 
                    resource_name as name,
                    action,
                    old_status,
                    new_status,
                    old_value,
                    new_value,
                    created_at as create_at
                FROM activity_logs
                {period_filter}
                ORDER BY created_at DESC
                LIMIT 50
            """)
            recent_activities = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT id, name, status, create_at 
                FROM resources 
                ORDER BY create_at DESC 
                LIMIT 10
            """)
            recent_activities = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
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
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
