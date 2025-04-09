# app.py (with fixes for JSON loading/saving)

import os
import json
import uuid
import tempfile # <--- 新增 import
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- 設定 ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
DATA_FILE = os.path.join(BASE_DIR, 'works_data.json')

# --- 初始化 Flask App ---
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# --- 輔助函數 ---

def allowed_file(filename):
    return filename and '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 載入已儲存的作品資料 (稍微調整錯誤處理)
def load_works_data():
    print(f"DEBUG: Attempting to load data from {DATA_FILE}")
    if not os.path.exists(DATA_FILE):
        print(f"DEBUG: Data file {DATA_FILE} not found, returning empty list.")
        return [] # 檔案不存在，視為空列表
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content.strip(): # 檢查是否為空或只包含空白
                print(f"DEBUG: Data file {DATA_FILE} is empty or whitespace, returning empty list.")
                return [] # 空檔案視為空列表
            # 嘗試讀取前，先回到檔案開頭 (如果上面 read() 了)
            f.seek(0)
            data = json.load(f)
            # 基本驗證：確保讀取的是一個列表
            if not isinstance(data, list):
                print(f"ERROR: Data in {DATA_FILE} is not a list. Returning empty list.", flush=True)
                # 可以選擇在這裡修復檔案，寫入 '[]'
                # try:
                #     with open(DATA_FILE, 'w', encoding='utf-8') as fix_f:
                #         fix_f.write('[]')
                #     print(f"INFO: Overwrote invalid data in {DATA_FILE} with an empty list.", flush=True)
                # except IOError as fix_e:
                #     print(f"ERROR: Could not fix invalid data in {DATA_FILE}: {fix_e}", flush=True)
                return []
            print(f"DEBUG: Successfully loaded {len(data)} items from {DATA_FILE}")
            return data
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON decode error in {DATA_FILE}: {e}. Returning empty list.", flush=True)
         # 同樣，可以選擇在這裡嘗試修復檔案
         # try:
         #     with open(DATA_FILE, 'w', encoding='utf-8') as fix_f:
         #         fix_f.write('[]')
         #     print(f"INFO: Overwrote corrupted data in {DATA_FILE} with an empty list.", flush=True)
         # except IOError as fix_e:
         #     print(f"ERROR: Could not fix corrupted data in {DATA_FILE}: {fix_e}", flush=True)
        return [] # JSON 格式錯誤，視為空列表
    except IOError as e:
        print(f"ERROR: IOError reading {DATA_FILE}: {e}. Returning empty list.", flush=True)
        return [] # 其他讀取錯誤，視為空列表

# 儲存作品資料 (使用原子寫入)
def save_works_data(data):
    # 使用 tempfile 在同一個目錄下建立臨時檔案，確保 rename 是原子操作
    try:
        # 'delete=False' 讓我們可以在關閉後手動處理檔案
        # 'dir=BASE_DIR' 確保臨時檔案和目標檔案在同一個檔案系統 (通常是原子 rename 的要求)
        # 'suffix' 和 'prefix' 幫助識別臨時檔案
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', delete=False, dir=BASE_DIR, suffix='.tmp', prefix=os.path.basename(DATA_FILE)+'.') as temp_f:
            print(f"DEBUG: Attempting to save {len(data)} items to temporary file {temp_f.name}. First item ID (if any): {data[0]['id'] if data else 'N/A'}", flush=True)
            json.dump(data, temp_f, ensure_ascii=False, indent=4)
            temp_filepath = temp_f.name # 記錄臨時檔案路徑

        # 核心：原子性地替換原始檔案
        os.replace(temp_filepath, DATA_FILE) # 在大多數系統上是原子操作
        print(f"DEBUG: Successfully saved data to {DATA_FILE} via atomic replace.", flush=True)
        return True
    except (IOError, TypeError, OSError) as e: # 捕捉可能的錯誤，包括 replace 失敗
        print(f"ERROR: Failed to save data to {DATA_FILE}: {e}", flush=True)
        # 如果臨時檔案還在，嘗試刪除它
        if 'temp_filepath' in locals() and os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
                print(f"DEBUG: Removed temporary file {temp_filepath} after save failure.", flush=True)
            except OSError as rem_e:
                 print(f"ERROR: Could not remove temporary file {temp_filepath}: {rem_e}", flush=True)
        return False

# --- 應用程式啟動時的準備 ---

# 確保上傳資料夾存在
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    print(f"INFO: Upload folder '{UPLOAD_FOLDER}' is ready.")
except OSError as e:
    print(f"ERROR: 無法建立上傳資料夾 '{UPLOAD_FOLDER}': {e}")
    # 這裡可以考慮是否要退出應用程式，如果上傳是核心功能

# *** 新增：確保資料檔案存在且有效 ***
def initialize_data_file():
    print(f"DEBUG: Initializing data file check for {DATA_FILE}...")
    try:
        if not os.path.exists(DATA_FILE):
            print(f"INFO: Data file {DATA_FILE} not found. Creating with empty list [].")
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                f.write('[]')
        else:
            # 檢查現有檔案是否至少是有效的 JSON
            print(f"DEBUG: Data file {DATA_FILE} exists. Verifying content...")
            load_works_data() # 調用 load_works_data，如果它檢測到錯誤並返回 []，表示初始狀態被視為空列表
            # 可選：如果 load_works_data 檢測到錯誤並嘗試修復了檔案，這裡不需要額外操作
            # 可選：如果 load_works_data 只是返回 [] 而不修復，可以在這裡強制寫入 '[]'
            # current_data = load_works_data()
            # if current_data is None: # 或者用其他方式標記 load_works_data 失敗
            #    print(f"INFO: Data file {DATA_FILE} was invalid. Resetting to empty list [].")
            #    with open(DATA_FILE, 'w', encoding='utf-8') as f:
            #        f.write('[]')
    except Exception as e:
        print(f"ERROR: Failed during data file initialization for {DATA_FILE}: {e}", flush=True)
        # 這裡可以考慮更嚴重的錯誤處理

initialize_data_file() # <--- 在定義路由之前執行初始化

# --- API Endpoints ---

# Endpoint: 處理作品上傳 (POST)
@app.route('/upload', methods=['POST'])
def upload_work():
    print("DEBUG: Received request for /upload")
    # ... (檢查欄位和檔案的部分保持不變) ...
    required_fields = ['author-name', 'current-habits', 'reflection']
    missing_fields = [field for field in required_fields if field not in request.form]
    if missing_fields:
        print(f"DEBUG: Upload failed - Missing fields: {missing_fields}")
        return jsonify({"success": False, "error": f"缺少必要的文字欄位: {', '.join(missing_fields)}"}), 400

    required_files = ['scorecard-image', 'comic-image']
    missing_files = [field for field in required_files if field not in request.files]
    if missing_files:
         print(f"DEBUG: Upload failed - Missing files: {missing_files}")
         return jsonify({"success": False, "error": f"缺少必要的圖片檔案: {', '.join(missing_files)}"}), 400

    author = request.form.get('author-name', '').strip()
    current_habits = request.form.get('current-habits', '').strip()
    reflection = request.form.get('reflection', '').strip()
    scorecard_file = request.files.get('scorecard-image')
    comic_file = request.files.get('comic-image')

    if not author: return jsonify({"success": False, "error": "作者姓名不能為空"}), 400
    if not current_habits: return jsonify({"success": False, "error": "目前的習慣描述不能為空"}), 400
    if not reflection: return jsonify({"success": False, "error": "反思與展望不能為空"}), 400
    if not scorecard_file or not scorecard_file.filename: return jsonify({"success": False, "error": "未選擇習慣計分卡檔案或檔案無效"}), 400
    if not comic_file or not comic_file.filename: return jsonify({"success": False, "error": "未選擇六格漫畫檔案或檔案無效"}), 400

    if not allowed_file(scorecard_file.filename):
        print(f"DEBUG: Upload failed - Invalid scorecard file type: {scorecard_file.filename}")
        return jsonify({"success": False, "error": f"不允許的習慣計分卡檔案格式 ({scorecard_file.filename.rsplit('.', 1)[1]})"}), 400
    if not allowed_file(comic_file.filename):
        print(f"DEBUG: Upload failed - Invalid comic file type: {comic_file.filename}")
        return jsonify({"success": False, "error": f"不允許的六格漫畫檔案格式 ({comic_file.filename.rsplit('.', 1)[1]})"}), 400


    saved_files_info = {}
    scorecard_filename = None
    comic_filename = None
    try:
        # 處理計分卡
        scorecard_ext = scorecard_file.filename.rsplit('.', 1)[1].lower()
        scorecard_filename = f"{uuid.uuid4()}_scorecard.{scorecard_ext}"
        scorecard_filepath = os.path.join(UPLOAD_FOLDER, scorecard_filename)
        print(f"DEBUG: Saving scorecard to {scorecard_filepath}")
        scorecard_file.save(scorecard_filepath)
        saved_files_info['scorecard'] = {'filename': scorecard_filename, 'filepath': scorecard_filepath}
        print(f"INFO: 已儲存計分卡: {scorecard_filepath}")

        # 處理漫畫
        comic_ext = comic_file.filename.rsplit('.', 1)[1].lower()
        comic_filename = f"{uuid.uuid4()}_comic.{comic_ext}"
        comic_filepath = os.path.join(UPLOAD_FOLDER, comic_filename)
        print(f"DEBUG: Saving comic to {comic_filepath}")
        comic_file.save(comic_filepath)
        saved_files_info['comic'] = {'filename': comic_filename, 'filepath': comic_filepath}
        print(f"INFO: 已儲存漫畫: {comic_filepath}")

        # *** 載入現有資料 (現在應該更健壯了) ***
        works = load_works_data() # 如果檔案無效或不存在，會返回 []

        # 建立新的作品資訊字典
        new_work = {
            "id": str(uuid.uuid4()),
            "author": author,
            "currentHabits": current_habits,
            "reflection": reflection,
            "scorecardFilename": scorecard_filename,
            "comicFilename": comic_filename
        }
        works.append(new_work) # 將新資料附加到 (可能為空的) 列表中
        print(f"DEBUG: Data prepared before saving: {works[-1]}")

        # *** 將更新後的作品列表存回 JSON 檔案 (使用原子寫入) ***
        save_successful = save_works_data(works)

        if not save_successful:
             # 觸發下面的 except 區塊來處理清理
             raise IOError(f"Failed to save data to {DATA_FILE} using atomic write")

        print("DEBUG: Called save_works_data successfully.")

        # 回傳成功訊息
        print("DEBUG: Upload process successful, returning 201.")
        return jsonify({"success": True, "message": "分享成功!", "work_id": new_work["id"]}), 201

    except Exception as e:
        # ... (錯誤處理和檔案清理部分保持不變) ...
        print(f"ERROR: 處理上傳時發生未預期錯誤: {e}", flush=True)
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
    print("DEBUG: Received request for /works")
    works_data = load_works_data() # 使用更新後的載入函數
    # print(f"DEBUG: Data loaded by /works: {works_data}") # (可以保留這個除錯信息)
    works_with_urls = []
    # ... (後續處理邏輯不變) ...
    for work in works_data:
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
            print(f"WARNING: Found data with unexpected format, skipped: {work}", flush=True)

    print(f"DEBUG: Returning {len(works_with_urls)} items from /works")
    return jsonify(works_with_urls)

# Endpoint: 提供上傳的圖片檔案 (GET)
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    # print(f"DEBUG: Request for uploaded file: {filename} from {UPLOAD_FOLDER}") # (可以保留)
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
         print(f"ERROR: File not found in /uploads/: {filename}", flush=True)
         return jsonify({"success": False, "error": "檔案未找到"}), 404

# Endpoint: 提供網站主頁面 (根路徑 /)
@app.route('/')
def index():
    # print("DEBUG: Request for index.html") # (可以保留)
    try:
        return send_from_directory(BASE_DIR, 'index.html')
    except FileNotFoundError:
        print(f"ERROR: index.html not found in {BASE_DIR}", flush=True)
        return "Homepage not found.", 404

# Gunicorn runs the 'app' instance directly