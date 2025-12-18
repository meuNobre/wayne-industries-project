from db import get_db_connection as g

conn = g()
cursor = conn.cursor(dictionary=True)

cursor.execute("SELECT * FROM users;")
users = cursor.fetchall()

print(users)

cursor.close()
conn.close()
