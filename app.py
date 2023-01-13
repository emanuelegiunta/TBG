from flask import Flask, render_template

import settings

#==============================================================================
# Flask stuff
app = Flask(__name__)

# Index
@app.route("/")
def index():
    return render_template('index.html')

# Testing "hidden" subpage
@app.route("/test/")
def test_js():
    return render_template('test.html')

@app.route("/test2/")
def test_taioqi():
    return render_template('test2.html')

if __name__ == '__main__':
    app.run(debug=settings.debug)
