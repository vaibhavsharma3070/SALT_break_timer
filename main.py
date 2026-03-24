import http.server
import socketserver
import webbrowser
import os
import socket

DIR = os.path.dirname(os.path.abspath(__file__))

def find_free_port(start=8001):
    for port in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("localhost", port)) != 0:
                return port
    return start

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def log_message(self, format, *args):
        pass  # silence request logs

if __name__ == "__main__":
    PORT = find_free_port()
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"  serving at {url}")
        webbrowser.open(url)
        httpd.serve_forever()