from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

RAW_DIR = os.path.join(BASE_DIR, "../data/raw")
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")

os.makedirs(RAW_DIR, exist_ok=True)

class Server(SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path != "/upload":
            self.send_error(404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(content_length)

            content_type = self.headers.get("Content-Type", "")
            boundary = content_type.split("boundary=")[-1].encode()

            parts = data.split(boundary)

            for part in parts:
                if b"filename=" in part:
                    headers, file_data = part.split(b"\r\n\r\n", 1)
                    file_data = file_data.rsplit(b"\r\n", 1)[0]

                    filename = headers.split(b'filename="')[1].split(b'"')[0].decode()

                    # allow only CSV
                    if not filename.endswith(".csv"):
                        continue

                    #  safe filename
                    filename = os.path.basename(filename)

                    filepath = os.path.join(RAW_DIR, filename)

                    with open(filepath, "wb") as f:
                        f.write(file_data)

            #  run pipeline safely
            subprocess.run([sys.executable, "data_cleaning.py"], cwd=BASE_DIR, check=True)
            subprocess.run([sys.executable, "csv_to_json.py"], cwd=BASE_DIR, check=True)

            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Upload & processing completed")

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b"Error processing file")

#  SERVER 
os.chdir(FRONTEND_DIR)

server = HTTPServer(("localhost", 8000), Server)
print("Server running at http://localhost:8000")
server.serve_forever()