from db import get_db_connection as g

conn = g()
cursor = conn.cursor()
cursor.execute("SHOW TABLES;")
print(cursor.fetchall())
conn.close()
