# app.py (with added debugging prints)

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
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 限制上傳大小為 16MB

# --- 輔助函數 ---

# 檢查副檔名是否允許
def allowed_file(filename):
    # 確保 filename 不是 None 且包含 '.'
    return filename and '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 載入已儲存的作品資料
def load_works_data():
    print(f"DEBUG: Attempting to load data from {DATA_FILE}") # <-- 除錯 Print
    if not os.path.exists(DATA_FILE):
        print(f"DEBUG: Data file {DATA_FILE} not found, returning empty list.") # <-- 除錯 Print
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content: # 處理空檔案的情況
                print(f"DEBUG: Data file {DATA_FILE} is empty, returning empty list.") # <-- 除錯 Print
                return []
            data = json.load(f)
            print(f"DEBUG: Successfully loaded {len(data)} items from {DATA_FILE}") # <-- 除錯 Print
            return data
    except (json.JSONDecodeError, FileNotFoundError, IOError) as e:
        # 將錯誤記錄到標準輸出 (會出現在 Render logs)
        print(f"ERROR: 讀取資料檔案時發生錯誤 ({DATA_FILE}): {e}", flush=True) # <-- 除錯 Print (flush=True 確保立即輸出)
        return [] # 如果檔案格式錯誤、找不到或讀取失敗，返回空列表

# 儲存作品資料
def save_works_data(data):
    try:
        # 打印準備儲存的資料摘要，避免打印過多內容
        print(f"DEBUG: Attempting to save {len(data)} items to {DATA_FILE}. First item ID (if any): {data[0]['id'] if data else 'N/A'}", flush=True) # <-- 除錯 Print
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"DEBUG: Successfully saved data to {DATA_FILE}", flush=True) # <-- 除錯 Print
        return True # 返回成功標誌
    except (IOError, TypeError) as e: # 捕捉可能的 TypeError (如果 data 不是可序列化的)
         # 將錯誤記錄到標準輸出
         print(f"ERROR: 寫入資料檔案時發生錯誤 ({DATA_FILE}): {e}", flush=True) # <-- 除錯 Print
         return False # 返回失敗標誌

# --- 應用程式啟動時的準備 ---
# 確保上傳資料夾存在
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    print(f"INFO: Upload folder '{UPLOAD_FOLDER}' is ready.")
except OSError as e:
    print(f"ERROR: 無法建立上傳資料夾 '{UPLOAD_FOLDER}': {e}")

# --- API Endpoints ---

# Endpoint: 處理作品上傳 (POST)
@app.route('/upload', methods=['POST'])
def upload_work():
    print("DEBUG: Received request for /upload") # <-- 除錯 Print
    # 1. 檢查必要的文字欄位是否存在
    required_fields = ['author-name', 'current-habits', 'reflection']
    missing_fields = [field for field in required_fields if field not in request.form]
    if missing_fields:
        print(f"DEBUG: Upload failed - Missing fields: {missing_fields}") # <-- 除錯 Print
        return jsonify({"success": False, "error": f"缺少必要的文字欄位: {', '.join(missing_fields)}"}), 400

    # 2. 檢查必要的圖片檔案是否存在
    required_files = ['scorecard-image', 'comic-image']
    missing_files = [field for field in required_files if field not in request.files]
    if missing_files:
         print(f"DEBUG: Upload failed - Missing files: {missing_files}") # <-- 除錯 Print
         return jsonify({"success": False, "error": f"缺少必要的圖片檔案: {', '.join(missing_files)}"}), 400

    # 3. 取得文字欄位資料
    author = request.form.get('author-name', '').strip()
    current_habits = request.form.get('current-habits', '').strip()
    reflection = request.form.get('reflection', '').strip()

    # 4. 取得圖片檔案物件
    scorecard_file = request.files.get('scorecard-image')
    comic_file = request.files.get('comic-image')

    # 5. 再次驗證欄位內容和檔案物件是否有效
    # (之前的檢查已經處理了 None 的情況，這裡主要檢查空字串和空檔名)
    if not author: return jsonify({"success": False, "error": "作者姓名不能為空"}), 400
    if not current_habits: return jsonify({"success": False, "error": "目前的習慣描述不能為空"}), 400
    if not reflection: return jsonify({"success": False, "error": "反思與展望不能為空"}), 400
    if not scorecard_file or not scorecard_file.filename: return jsonify({"success": False, "error": "未選擇習慣計分卡檔案或檔案無效"}), 400
    if not comic_file or not comic_file.filename: return jsonify({"success": False, "error": "未選擇六格漫畫檔案或檔案無效"}), 400

    # 6. 驗證檔案類型
    if not allowed_file(scorecard_file.filename):
        print(f"DEBUG: Upload failed - Invalid scorecard file type: {scorecard_file.filename}") # <-- 除錯 Print
        return jsonify({"success": False, "error": f"不允許的習慣計分卡檔案格式 ({scorecard_file.filename.rsplit('.', 1)[1]})"}), 400
    if not allowed_file(comic_file.filename):
        print(f"DEBUG: Upload failed - Invalid comic file type: {comic_file.filename}") # <-- 除錯 Print
        return jsonify({"success": False, "error": f"不允許的六格漫畫檔案格式 ({comic_file.filename.rsplit('.', 1)[1]})"}), 400

    # 7. 處理並儲存檔案
    saved_files_info = {}
    scorecard_filename = None
    comic_filename = None
    try:
        # 處理計分卡
        scorecard_ext = scorecard_file.filename.rsplit('.', 1)[1].lower()
        scorecard_filename = f"{uuid.uuid4()}_scorecard.{scorecard_ext}"
        scorecard_filepath = os.path.join(UPLOAD_FOLDER, scorecard_filename)
        print(f"DEBUG: Saving scorecard to {scorecard_filepath}") # <-- 除錯 Print
        scorecard_file.save(scorecard_filepath)
        saved_files_info['scorecard'] = {'filename': scorecard_filename, 'filepath': scorecard_filepath}
        print(f"INFO: 已儲存計分卡: {scorecard_filepath}")

        # 處理漫畫
        comic_ext = comic_file.filename.rsplit('.', 1)[1].lower()
        comic_filename = f"{uuid.uuid4()}_comic.{comic_ext}"
        comic_filepath = os.path.join(UPLOAD_FOLDER, comic_filename)
        print(f"DEBUG: Saving comic to {comic_filepath}") # <-- 除錯 Print
        comic_file.save(comic_filepath)
        saved_files_info['comic'] = {'filename': comic_filename, 'filepath': comic_filepath}
        print(f"INFO: 已儲存漫畫: {comic_filepath}")

        # 8. 載入現有資料
        # (在 save_works_data 前先載入是正確的)
        works = load_works_data()

        # 9. 建立新的作品資訊字典
        new_work = {
            "id": str(uuid.uuid4()),
            "author": author,
            "currentHabits": current_habits,
            "reflection": reflection,
            "scorecardFilename": scorecard_filename,
            "comicFilename": comic_filename
        }
        works.append(new_work)
        print(f"DEBUG: Data prepared before saving: {works[-1]}") # <-- 除錯 Print (只印最後一筆)

        # 10. 將更新後的作品列表存回 JSON 檔案
        save_successful = save_works_data(works)

        if not save_successful:
             # 如果 save_works_data 內部報錯並返回 False
             print("ERROR: save_works_data reported an error.") # <-- 除錯 Print
             # 觸發下面的 except Exception as e: 區塊似乎更好？
             # 或者直接觸發清理和返回 500 錯誤
             raise IOError(f"Failed to save data to {DATA_FILE}")


        print("DEBUG: Called save_works_data successfully.") # <-- 除錯 Print

        # 11. 回傳成功訊息
        print("DEBUG: Upload process successful, returning 201.") # <-- 除錯 Print
        return jsonify({"success": True, "message": "分享成功!", "work_id": new_work["id"]}), 201

    except Exception as e:
        # 將更詳細的錯誤記錄到標準輸出
        print(f"ERROR: 處理上傳時發生未預期錯誤: {e}", flush=True)
        # 如果過程中任何步驟失敗，嘗試刪除已儲存的檔案
        if 'scorecard' in saved_files_info and os.path.exists(saved_files_info['scorecard']['filepath']):
            try:
                os.remove(saved_files_info['scorecard']['filepath'])
                print(f"INFO: 已刪除部分上傳的計分卡檔案: {saved_files_info['scorecard']['filepath']}")
            except OSError as remove_err:
                print(f"ERROR: 嘗試刪除計分卡檔案時失敗: {remove_err}")
        if 'comic' in saved_files_info and os.path.exists(saved_files_info['comic']['filepath']):
             try:
                 os.remove(saved_files_info['comic']['filepath'])
                 print(f"INFO: 已刪除部分上傳的漫畫檔案: {saved_files_info['comic']['filepath']}")
             except OSError as remove_err:
                 print(f"ERROR: 嘗試刪除漫畫檔案時失敗: {remove_err}")

        return jsonify({"success": False, "error": f"伺服器內部錯誤，無法儲存檔案或資料"}), 500


# Endpoint: 取得所有作品列表 (GET)
@app.route('/works', methods=['GET'])
def get_works():
    print("DEBUG: Received request for /works") # <-- 除錯 Print
    works_data = load_works_data()
    print(f"DEBUG: Data loaded by /works: {works_data}") # <-- 除錯 Print (看讀取的原始資料)
    works_with_urls = []

    for work in works_data:
        # 檢查確保 work 是字典且包含所有必要鍵
        if isinstance(work, dict) and all(key in work for key in ["id", "author", "currentHabits", "reflection", "scorecardFilename", "comicFilename"]):
            works_with_urls.append({
                "id": work["id"],
                "author": work["author"],
                "currentHabits": work["currentHabits"],
                "reflection": work["reflection"],
                "scorecardImageUrl": f"/uploads/{work['scorecardFilename']}",
                "comicImageUrl": f"/uploads/{work['comicFilename']}"
            })
        else:
            # 記錄格式不符的資料，幫助除錯
            print(f"WARNING: Found data with unexpected format, skipped: {work}", flush=True)

    print(f"DEBUG: Returning {len(works_with_urls)} items from /works") # <-- 除錯 Print
    return jsonify(works_with_urls)


# Endpoint: 提供上傳的圖片檔案 (GET)
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    print(f"DEBUG: Request for uploaded file: {filename} from {UPLOAD_FOLDER}") # <-- 除錯 Print
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
         print(f"ERROR: File not found in /uploads/: {filename}", flush=True)
         return jsonify({"success": False, "error": "檔案未找到"}), 404


# Endpoint: 提供網站主頁面 (根路徑 /)
@app.route('/')
def index():
    print("DEBUG: Request for index.html") # <-- 除錯 Print
    try:
        return send_from_directory(BASE_DIR, 'index.html')
    except FileNotFoundError:
        print(f"ERROR: index.html not found in {BASE_DIR}", flush=True)
        return "Homepage not found.", 404

# Gunicorn runs the 'app' instance directly, no need for __main__ block for app.run()