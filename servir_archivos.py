from flask import Flask, send_from_directory

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory('.', 'timeline.html')

@app.route('/timeline.json')
def timeline_data():
    return send_from_directory('.', 'timeline.json')

@app.route('/all_exo.csv')
def csv_data():
    return send_from_directory('.', 'all_exo.csv')

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')

@app.route('/timeline.js')
def timeline_js():
    return send_from_directory('.', 'timeline.js')

if __name__ == '__main__':
    app.run(debug=True)