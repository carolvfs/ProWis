import pymonetdb as db

connection = db.connect(database='vis_db', hostname='localhost', port=int(5001), username='monetdb', password='monetdb')

# Create tables
with open('schema.sql') as file1, open('schema_static_tables.sql') as file2:
    connection.execute(file1.read())
    connection.execute(file2.read())

connection.commit()
connection.close()