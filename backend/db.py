import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user="wayne_app",
        password="Wayne@123",
        database="wayne_industries"
    )