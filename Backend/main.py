from flask import Flask
from routes import routes
from flask_cors import CORS

app = Flask(__name__)
# Change the origin later to the Frontend URL like  https://your-app.vercel.app for security purposes

CORS(app,origins="*")
app.register_blueprint(routes,url_prefix="")


# Not Needed for production, but useful for local development
# if __name__ == "__main__":
#     app.run(debug=True)