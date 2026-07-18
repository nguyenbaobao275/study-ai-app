$ErrorActionPreference = "Stop"

$docs = $PSScriptRoot
$source = Join-Path $docs "generate_thesis_chapter1.ps1"
$target = Join-Path $docs "generate_full_studyai_report.ps1"
$text = [System.IO.File]::ReadAllText($source, [System.Text.Encoding]::UTF8)

$text = $text.Replace('KHOA_LUAN_STUDYAI_DEN_CHUONG_1.docx', 'BaoCaoDeTaiStudyAI.docx')
$text = $text.Replace('ĐẠI HỌC THÁI NGUYÊN', 'ĐẠI HỌC HUẾ')
$text = $text.Replace('[HỌ VÀ TÊN SINH VIÊN]', 'HUỲNH HUY')
$text = $text.Replace('Mã số sinh viên: [MSSV]', 'Mã số sinh viên: 22T1020625')
$text = $text.Replace('Lớp: [TÊN LỚP]', 'Lớp: Công nghệ thông tin')
$text = $text.Replace('[HỌC HÀM, HỌC VỊ, HỌ TÊN GIẢNG VIÊN]', 'ĐOÀN THỊ HỒNG PHƯỚC')
$text = $text.Replace('[HỌC HÀM, HỌC VỊ, HỌ TÊN GIẢNG VIÊN HƯỚNG DẪN]', 'Đoàn Thị Hồng Phước')
$text = $text.Replace('THÁI NGUYÊN - 2026', 'HUẾ - 2026')
$text = $text.Replace('Thái Nguyên, ngày ..... tháng ..... năm 2026', 'Huế, ngày ..... tháng ..... năm 2026')
$text = $text.Replace('Trường Đại học Khoa học - Đại học Thái Nguyên', 'Trường Đại học Khoa học - Đại học Huế')

$text = $text.Replace('  function Add-Cover([bool]$inner = $false) {', @'
  function Add-Figure([string]$path, [string]$caption, [double]$widthCm = 14.5) {
    if (-not (Test-Path $path)) { return }
    $selection.ParagraphFormat.Alignment = 1
    $selection.ParagraphFormat.FirstLineIndent = 0
    $shape = $selection.InlineShapes.AddPicture($path, $false, $true)
    $shape.LockAspectRatio = -1
    $shape.Width = Cm $widthCm
    $selection.SetRange($shape.Range.End, $shape.Range.End)
    $selection.TypeParagraph()
    Add-NoIndent $caption 1 $false 12
    $selection.TypeParagraph()
  }

  function Add-Cover([bool]$inner = $false) {
'@)

$text = $text.Replace('  # Phần đầu, đánh số La Mã', @'
  # Phần đầu, đánh số La Mã
  Add-Heading "LỜI CAM ĐOAN" 1
  Add-Body "Em xin cam đoan báo cáo với đề tài “Xây dựng hệ thống trợ lý học tập cá nhân StudyAI ứng dụng trí tuệ nhân tạo và kỹ thuật RAG” là kết quả nghiên cứu và triển khai của cá nhân em dưới sự hướng dẫn của giảng viên. Các nội dung tham khảo đều được ghi nguồn trong phần tài liệu tham khảo."
  Add-Body "Mã nguồn, dữ liệu thử nghiệm, kết quả kiểm thử và hình ảnh minh họa được trình bày trung thực. Em chịu trách nhiệm về tính chính xác của nội dung báo cáo và không sao chép kết quả của công trình khác dưới bất kỳ hình thức nào."
  Add-NoIndent "Huế, ngày ..... tháng ..... năm 2026" 2 $false 14
  Add-NoIndent "Sinh viên thực hiện" 2 $true 14
  Add-Blank 3
  Add-NoIndent "HUỲNH HUY" 2 $true 14
  Add-PageBreak
'@)

$text = $text.Replace('Add-NoIndent "[HỌ VÀ TÊN SINH VIÊN]" 2 $true 14', 'Add-NoIndent "HUỲNH HUY" 2 $true 14')
$text = $text.Replace('Add-Heading "MỞ ĐẦU" 1', 'Add-Heading "CHƯƠNG 1. GIỚI THIỆU ĐỀ TÀI" 1')
for ($i = 6; $i -ge 1; $i--) {
  $text = $text.Replace("Add-Heading `"$i. ", "Add-Heading `"1.$i. ")
}
$text = $text.Replace('Add-Heading "CHƯƠNG 1. TỔNG QUAN VỀ ĐỀ TÀI VÀ CƠ SỞ LÝ THUYẾT" 1', 'Add-Heading "CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ LIÊN QUAN" 1')

$chapter2Start = $text.IndexOf('Add-Heading "CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ LIÊN QUAN" 1')
$referencesStart = $text.IndexOf('Add-Heading "TÀI LIỆU THAM KHẢO SỬ DỤNG TRONG CHƯƠNG 1" 1')
if ($chapter2Start -lt 0 -or $referencesStart -lt 0) { throw "Không tìm thấy vùng chương để chuyển đổi." }
$before = $text.Substring(0, $chapter2Start)
$chapter2 = $text.Substring($chapter2Start, $referencesStart - $chapter2Start)
$after = $text.Substring($referencesStart)
$chapter2 = $chapter2.Replace('Add-Heading "1.', 'Add-Heading "2.')
$chapter2 = $chapter2.Replace('Bảng 1.', 'Bảng 2.')
$chapter2 = $chapter2.Replace('Chương 1', 'Chương 2')
$chapter2 = $chapter2.Replace('CHƯƠNG 1', 'CHƯƠNG 2')
$text = $before + $chapter2 + $after

$oldTableList = @'
  Add-Heading "DANH MỤC CÁC BẢNG" 1
  Add-NoIndent "Bảng 1.1. So sánh các phương án hỗ trợ học tập bằng công nghệ" 0 $false 14
  Add-NoIndent "Bảng 1.2. Các nhóm chức năng chính của hệ thống StudyAI" 0 $false 14
  Add-NoIndent "Bảng 1.3. Các yêu cầu phi chức năng chính" 0 $false 14
'@
$newTableList = @'
  Add-Heading "DANH MỤC CÁC HÌNH" 1
  Add-NoIndent "Hình 3.1. Kiến trúc logic của hệ thống StudyAI" 0 $false 14
  Add-NoIndent "Hình 3.2. Chuỗi xử lý hỏi đáp RAG" 0 $false 14
  Add-NoIndent "Hình 4.1. Giao diện đăng nhập StudyAI" 0 $false 14
  Add-NoIndent "Hình 4.2. Giao diện upload và quản lý tài liệu" 0 $false 14
  Add-NoIndent "Hình 4.3. Chi tiết tài liệu và các công cụ AI" 0 $false 14
  Add-NoIndent "Hình 4.4. Giao diện tìm kiếm tài liệu" 0 $false 14
  Add-PageBreak

  Add-Heading "DANH MỤC CÁC BẢNG" 1
  Add-NoIndent "Bảng 2.1. So sánh các phương án hỗ trợ học tập bằng công nghệ" 0 $false 14
  Add-NoIndent "Bảng 2.2. Các nhóm chức năng chính của hệ thống StudyAI" 0 $false 14
  Add-NoIndent "Bảng 2.3. Các yêu cầu phi chức năng chính" 0 $false 14
  Add-NoIndent "Bảng 3.1. Các yêu cầu chức năng chính" 0 $false 14
  Add-NoIndent "Bảng 3.2. Các trường hợp sử dụng tiêu biểu" 0 $false 14
  Add-NoIndent "Bảng 3.3. Vai trò của các bảng dữ liệu" 0 $false 14
  Add-NoIndent "Bảng 3.4. Một số endpoint quan trọng" 0 $false 14
  Add-NoIndent "Bảng 4.1. Thành phần môi trường thực nghiệm" 0 $false 14
  Add-NoIndent "Bảng 4.2. Kết quả kiểm thử backend" 0 $false 14
  Add-NoIndent "Bảng 4.3. Kết quả build frontend" 0 $false 14
  Add-NoIndent "Bảng 4.4. Đánh giá các luồng chính" 0 $false 14
'@
$text = $text.Replace($oldTableList, $newTableList)

$insertMarker = '  Add-Heading "TÀI LIỆU THAM KHẢO SỬ DỤNG TRONG CHƯƠNG 1" 1'
$additional = [System.IO.File]::ReadAllText((Join-Path $docs "studyai_report_chapters_3_5.ps1part"), [System.Text.Encoding]::UTF8)
$appendixMarker = '  Add-Heading "PHỤ LỤC" 1'
$appendixIndex = $additional.IndexOf($appendixMarker)
if ($appendixIndex -lt 0) { throw "Không tìm thấy phần phụ lục." }
$chapters = $additional.Substring(0, $appendixIndex)
$appendices = $additional.Substring($appendixIndex)
$text = $text.Replace($insertMarker, $chapters + "`r`n" + '  Add-Heading "TÀI LIỆU THAM KHẢO" 1')
$referenceLoop = '  foreach ($reference in $references) { Add-NoIndent $reference 3 $false 14 }'
$text = $text.Replace($referenceLoop, $referenceLoop + "`r`n  Add-PageBreak`r`n" + $appendices)
$text = $text.Replace('Write-Output "PROGRESS=CHAPTER_ONE_DONE"', 'Write-Output "PROGRESS=FULL_REPORT_DONE"')
$text = $text.Replace('  foreach ($tableOfContents in $doc.TablesOfContents) { $tableOfContents.Update() }' + "`r`n" + '  foreach ($field in $doc.Fields) { $field.Update() | Out-Null }', '  Write-Output "PROGRESS=TOC_UPDATE_START"' + "`r`n" + '  foreach ($tableOfContents in $doc.TablesOfContents) { $tableOfContents.Update() }' + "`r`n" + '  Write-Output "PROGRESS=TOC_UPDATE_DONE"')
$text = $text.Replace('    $section.Headers.Item(1).LinkToPrevious = $false' + "`r`n" + '    $section.Footers.Item(1).LinkToPrevious = $false', '    try {' + "`r`n" + '      $section.Headers.Item(1).LinkToPrevious = $false' + "`r`n" + '      $section.Footers.Item(1).LinkToPrevious = $false' + "`r`n" + '    } catch { }')

[System.IO.File]::WriteAllText($target, $text, [System.Text.UTF8Encoding]::new($true))
Write-Output "GENERATOR=$target"
