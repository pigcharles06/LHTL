import os
import json
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- 設定 ---
# 使用基於 app.py 所在位置的絕對路徑，提高可靠性
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads') # 上傳檔案儲存資料夾
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'} # 允許的圖片副檔名
DATA_FILE = os.path.join(BASE_DIR, 'works_data.json') # 儲存作品資訊的 JSON 檔案

# --- 初始化 Flask App ---
app = Flask(__name__, static_folder='static', static_url_path='/static') # 明確指定 static 資料夾
CORS(app) # 初始化 CORS
# 注意: UPLOAD_FOLDER 不應透過 app.config 設定用於 send_from_directory，直接使用路徑變數即可
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER # (不再需要這樣設定)
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
            content = f.read()
            if not content: # 處理空檔案的情況
                return []
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError, IOError) as e:
        print(f"讀取資料檔案時發生錯誤 ({DATA_FILE}): {e}")
        return [] # 如果檔案格式錯誤、找不到或讀取失敗，返回空列表

# 儲存作品資料
def save_works_data(data):
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except IOError as e:
         print(f"寫入資料檔案時發生錯誤 ({DATA_FILE}): {e}")

# --- 應用程式啟動時的準備 ---
# 確保上傳資料夾存在
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    print(f"Upload folder '{UPLOAD_FOLDER}' is ready.")
except OSError as e:
    print(f"無法建立上傳資料夾 '{UPLOAD_FOLDER}': {e}")
    # 根據需要決定是否中止程式

# --- API Endpoints ---

# Endpoint: 處理作品上傳 (POST) - ** 已修改 **
@app.route('/upload', methods=['POST'])
def upload_work():
    # 1. 檢查必要的文字欄位是否存在
    required_fields = ['author-name', 'current-habits', 'reflection']
    missing_fields = [field for field in required_fields if field not in request.form]
    if missing_fields:
        return jsonify({"success": False, "error": f"缺少必要的文字欄位: {', '.join(missing_fields)}"}), 400

    # 2. 檢查必要的圖片檔案是否存在
    required_files = ['scorecard-image', 'comic-image']
    missing_files = [field for field in required_files if field not in request.files]
    if missing_files:
         return jsonify({"success": False, "error": f"缺少必要的圖片檔案: {', '.join(missing_files)}"}), 400

    # 3. 取得文字欄位資料
    author = request.form.get('author-name', '').strip()
    current_habits = request.form.get('current-habits', '').strip()
    reflection = request.form.get('reflection', '').strip()

    # 4. 取得圖片檔案物件
    scorecard_file = request.files.get('scorecard-image')
    comic_file = request.files.get('comic-image')

    # 5. 再次驗證欄位內容和檔案物件是否有效
    if not author: return jsonify({"success": False, "error": "作者姓名不能為空"}), 400
    if not current_habits: return jsonify({"success": False, "error": "目前的習慣描述不能為空"}), 400
    if not reflection: return jsonify({"success": False, "error": "反思與展望不能為空"}), 400
    if not scorecard_file or scorecard_file.filename == '': return jsonify({"success": False, "error": "未選擇習慣計分卡檔案"}), 400
    if not comic_file or comic_file.filename == '': return jsonify({"success": False, "error": "未選擇六格漫畫檔案"}), 400

    # 6. 驗證檔案類型
    if not allowed_file(scorecard_file.filename):
        return jsonify({"success": False, "error": f"不允許的習慣計分卡檔案格式 ({scorecard_file.filename.rsplit('.', 1)[1]})"}), 400
    if not allowed_file(comic_file.filename):
         return jsonify({"success": False, "error": f"不允許的六格漫畫檔案格式 ({comic_file.filename.rsplit('.', 1)[1]})"}), 400

    # 7. 處理並儲存檔案
    saved_files_info = {} # 儲存成功儲存的檔案資訊，以便出錯時刪除
    try:
        # 處理計分卡
        scorecard_ext = scorecard_file.filename.rsplit('.', 1)[1].lower()
        scorecard_filename = f"{uuid.uuid4()}_scorecard.{scorecard_ext}"
        scorecard_filepath = os.path.join(UPLOAD_FOLDER, scorecard_filename)
        scorecard_file.save(scorecard_filepath)
        saved_files_info['scorecard'] = {'filename': scorecard_filename, 'filepath': scorecard_filepath}
        print(f"已儲存計分卡: {scorecard_filepath}")

        # 處理漫畫
        comic_ext = comic_file.filename.rsplit('.', 1)[1].lower()
        comic_filename = f"{uuid.uuid4()}_comic.{comic_ext}"
        comic_filepath = os.path.join(UPLOAD_FOLDER, comic_filename)
        comic_file.save(comic_filepath)
        saved_files_info['comic'] = {'filename': comic_filename, 'filepath': comic_filepath}
        print(f"已儲存漫畫: {comic_filepath}")

        # 8. 載入現有資料
        works = load_works_data()

        # 9. 建立新的作品資訊字典 (使用新結構)
        new_work = {
            "id": str(uuid.uuid4()),
            "author": author,
            "currentHabits": current_habits,
            "reflection": reflection,
            "scorecardFilename": scorecard_filename, # 儲存檔名
            "comicFilename": comic_filename        # 儲存檔名
        }
        works.append(new_work)

        # 10. 將更新後的作品列表存回 JSON 檔案
        save_works_data(works)

        # 11. 回傳成功的訊息和新作品的資訊給前端
        #     (只回傳部分資訊，避免洩漏完整檔名路徑給前端，前端只需要ID)
        return jsonify({"success": True, "message": "分享成功!", "work_id": new_work["id"]}), 201

    except Exception as e:
        print(f"處理上傳時發生錯誤: {e}")
        # 如果過程中任何步驟失敗，嘗試刪除已儲存的檔案
        if 'scorecard' in saved_files_info and os.path.exists(saved_files_info['scorecard']['filepath']):
            try:
                os.remove(saved_files_info['scorecard']['filepath'])
                print(f"已刪除部分上傳的計分卡檔案: {saved_files_info['scorecard']['filepath']}")
            except OSError as remove_err:
                print(f"嘗試刪除計分卡檔案時失敗: {remove_err}")
        if 'comic' in saved_files_info and os.path.exists(saved_files_info['comic']['filepath']):
             try:
                 os.remove(saved_files_info['comic']['filepath'])
                 print(f"已刪除部分上傳的漫畫檔案: {saved_files_info['comic']['filepath']}")
             except OSError as remove_err:
                 print(f"嘗試刪除漫畫檔案時失敗: {remove_err}")

        return jsonify({"success": False, "error": f"伺服器內部錯誤，無法儲存檔案或資料: {e}"}), 500


# Endpoint: 取得所有作品列表 (GET) - ** 已修改 **
@app.route('/works', methods=['GET'])
def get_works():
    works_data = load_works_data()
    works_with_urls = []

    for work in works_data:
        # 基本檢查，確保資料包含預期的欄位
        if all(key in work for key in ["id", "author", "currentHabits", "reflection", "scorecardFilename", "comicFilename"]):
            works_with_urls.append({
                "id": work["id"],
                "author": work["author"],
                "currentHabits": work["currentHabits"],
                "reflection": work["reflection"],
                # 產生前端需要的完整圖片 URL
                "scorecardImageUrl": f"/uploads/{work['scorecardFilename']}",
                "comicImageUrl": f"/uploads/{work['comicFilename']}"
            })
        else:
            print(f"警告: 發現格式不符的資料，已跳過: {work.get('id', '未知ID')}")

    return jsonify(works_with_urls)


# Endpoint: 提供上傳的圖片檔案 (GET) - **保持不變**
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    # 從設定好的 UPLOAD_FOLDER 提供檔案
    print(f"請求檔案: {filename} 從 {UPLOAD_FOLDER}")
    try:
        # 使用 send_from_directory 更安全，它會處理路徑問題
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
         print(f"檔案未找到: {os.path.join(UPLOAD_FOLDER, filename)}")
         return jsonify({"success": False, "error": "檔案未找到"}), 404


# Endpoint: 提供網站主頁面 (根路徑 /) - **保持不變**
@app.route('/')
def index():
    # 從專案根目錄提供 index.html
    print("請求主頁面 index.html")
    # 使用 send_from_directory 比 send_file 更推薦
    return send_from_directory(BASE_DIR, 'index.html')

# --- Flask App 不再需要 if __name__ == '__main__': app.run() ---
# --- Gunicorn 會負責啟動 'app' 這個實例 ---