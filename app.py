import os
import json
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS # <--- 匯入 CORS

# --- 設定 ---
UPLOAD_FOLDER = 'uploads' # 設定上傳檔案儲存的資料夾名稱
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'} # 允許的圖片副檔名
DATA_FILE = 'works_data.json' # 用來儲存作品資訊的 JSON 檔案

# --- 初始化 Flask App ---
app = Flask(__name__)
CORS(app) # <--- 初始化 CORS，允許所有來源 (開發時方便，正式上線建議限制來源)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 限制上傳大小為 16MB

# --- 輔助函數 ---

# 檢查副檔名是否允許
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 載入已儲存的作品資料
def load_works_data():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return [] # 如果檔案不存在或格式錯誤，返回空列表

# 儲存作品資料
def save_works_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# 確保上傳資料夾存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# --- API Endpoints ---

# 處理作品上傳 (POST)
@app.route('/upload', methods=['POST'])
def upload_work():
    if 'work-image' not in request.files:
        return jsonify({"error": "沒有圖片檔案"}), 400
    if 'work-description' not in request.form:
         return jsonify({"error": "缺少作品介紹"}), 400

    file = request.files['work-image']
    description = request.form['work-description']

    if file.filename == '':
        return jsonify({"error": "未選擇檔案"}), 400

    if file and allowed_file(file.filename):
        # 生成唯一檔名，避免覆蓋
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

        try:
            file.save(filepath)

            # 載入現有資料
            works = load_works_data()

            # 新增作品資訊 (只儲存相對路徑和描述)
            new_work = {
                "id": str(uuid.uuid4()), # 給作品一個唯一 ID
                "filename": unique_filename,
                "description": description
            }
            works.append(new_work)

            # 儲存更新後的資料
            save_works_data(works)

            return jsonify({"success": True, "message": "上傳成功!", "work": new_work}), 201

        except Exception as e:
             print(f"儲存檔案或資料時發生錯誤: {e}")
             # 如果儲存檔案成功但寫入 JSON 失敗，可能需要刪除已儲存的檔案
             if os.path.exists(filepath):
                 os.remove(filepath)
             return jsonify({"error": "伺服器內部錯誤"}), 500

    else:
        return jsonify({"error": "不允許的檔案格式"}), 400

# 取得所有作品列表 (GET)
@app.route('/works', methods=['GET'])
def get_works():
    works = load_works_data()
    # 為每個作品添加完整的圖片 URL
    works_with_urls = []
    for work in works:
        works_with_urls.append({
            "id": work.get("id", ""), # 向下相容舊資料
            "imageUrl": f"/uploads/{work['filename']}", # *** 提供前端使用的圖片路徑 ***
            "description": work['description']
        })
    return jsonify(works_with_urls)

# 提供上傳的圖片檔案 (GET)
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # 使用 send_from_directory 更安全地提供檔案
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 提供主頁面 index.html
@app.route('/')
def index():
    # 讓 Flask 直接提供你的 HTML 檔案
    # 這樣可以確保前端 JS 的 API 呼叫和後端在同一個來源 (origin)
    return send_from_directory('.', 'index.html') # 從目前資料夾提供 index.html

# --- 啟動伺服器 ---
# --- 啟動 Flask 伺服器 ---
if __name__ == '__main__':
    print("正在啟動 Flask 伺服器...")
    # debug=True 會啟用重載器，我們指定使用 'stat' 類型避免 watchdog 問題
    app.run(debug=True, host='0.0.0.0', port=5000, reloader_type='stat')