import pandas as pd
import re
import os

print("🚀 Script started")

file_path = "data.csv"  # 👈 عدل المسار لو محتاج

# تأكد إن الملف موجود
if not os.path.exists(file_path):
    print("❌ File not found:", file_path)
    exit()

print("📂 File found")

# اقرأ CSV
df = pd.read_csv(file_path)

print("📊 Loaded rows:", len(df))

# تأكد إن العمود موجود
if "message" not in df.columns:
    print("❌ Column 'message' not found!")
    print("Available columns:", df.columns.tolist())
    exit()

# 🔧 تحويل الأرقام العربية لإنجليزية
def arabic_to_english(text):
    if pd.isna(text):
        return ""
    arabic_nums = "٠١٢٣٤٥٦٧٨٩"
    return str(text).translate(str.maketrans(arabic_nums, "0123456789"))

# 🔧 Normalize الرقم المصري
def normalize_egyptian(num):
    if not num:
        return None

    num = num.replace(" ", "").replace("-", "")

    if num.startswith("00"):
        num = num[2:]

    if num.startswith("20"):
        num = num[2:]

    if num.startswith("0"):
        num = num[1:]

    if re.match(r"^(10|11|12|15)\d{8}$", num):
        return "+20" + num

    return None

results = []

# 🔍 processing
for idx, row in df.iterrows():
    text = arabic_to_english(row["message"])

    # نحتفظ بالأرقام فقط
    digits = re.sub(r"\D", "", text)

    found_number = None

    # sliding window
    for i in range(len(digits)):
        for length in range(9, 12):
            part = digits[i:i+length]
            normalized = normalize_egyptian(part)

            if normalized:
                found_number = normalized
                break
        if found_number:
            break

    results.append(found_number)

# ➕ ضيف عمود جديد
df["phone"] = results
df["has_phone"] = df["phone"].notna()

print("📞 Phones found:", df["has_phone"].sum())

# 📤 حفظ
df.to_csv("output.csv", index=False, encoding="utf-8-sig")

print("✅ Saved to output.csv")
print("📁 Location:", os.getcwd())