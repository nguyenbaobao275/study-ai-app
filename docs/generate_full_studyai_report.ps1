$ErrorActionPreference = "Stop"

$scriptDirectory = if ($PSScriptRoot) { $PSScriptRoot } else { Join-Path (Get-Location) "docs" }
$projectRoot = Split-Path -Parent $scriptDirectory
$outputDocx = Join-Path $scriptDirectory "BaoCaoDeTaiStudyAI.docx"

function Cm([double]$value) { return $value * 28.3464567 }

$word = $null
$doc = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $doc = $word.Documents.Add()
  $selection = $word.Selection

  foreach ($section in $doc.Sections) {
    $section.PageSetup.PaperSize = 7
    $section.PageSetup.TopMargin = Cm 2
    $section.PageSetup.BottomMargin = Cm 2
    $section.PageSetup.LeftMargin = Cm 3.5
    $section.PageSetup.RightMargin = Cm 2
  }

  $normal = $doc.Styles.Item(-1)
  $normal.Font.Name = "Times New Roman"
  $normal.Font.Size = 14
  $normal.ParagraphFormat.Alignment = 3
  $normal.ParagraphFormat.LineSpacingRule = 1
  $normal.ParagraphFormat.SpaceAfter = 6
  $normal.ParagraphFormat.FirstLineIndent = Cm 1

  $heading1 = $doc.Styles.Item(-2)
  $heading1.Font.Name = "Times New Roman"
  $heading1.Font.Size = 16
  $heading1.Font.Bold = $true
  $heading1.Font.Color = 0
  $heading1.ParagraphFormat.Alignment = 1
  $heading1.ParagraphFormat.SpaceBefore = 12
  $heading1.ParagraphFormat.SpaceAfter = 12
  $heading1.ParagraphFormat.FirstLineIndent = 0
  $heading1.ParagraphFormat.KeepWithNext = $true

  $heading2 = $doc.Styles.Item(-3)
  $heading2.Font.Name = "Times New Roman"
  $heading2.Font.Size = 14
  $heading2.Font.Bold = $true
  $heading2.Font.Color = 0
  $heading2.ParagraphFormat.Alignment = 0
  $heading2.ParagraphFormat.SpaceBefore = 10
  $heading2.ParagraphFormat.SpaceAfter = 6
  $heading2.ParagraphFormat.FirstLineIndent = 0
  $heading2.ParagraphFormat.KeepWithNext = $true

  $heading3 = $doc.Styles.Item(-4)
  $heading3.Font.Name = "Times New Roman"
  $heading3.Font.Size = 14
  $heading3.Font.Bold = $true
  $heading3.Font.Italic = $true
  $heading3.Font.Color = 0
  $heading3.ParagraphFormat.Alignment = 0
  $heading3.ParagraphFormat.SpaceBefore = 6
  $heading3.ParagraphFormat.SpaceAfter = 6
  $heading3.ParagraphFormat.FirstLineIndent = 0
  $heading3.ParagraphFormat.KeepWithNext = $true

  function Set-BodyFormat {
    $selection.Style = $doc.Styles.Item(-1)
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $false
    $selection.Font.Italic = $false
    $selection.ParagraphFormat.Alignment = 3
    $selection.ParagraphFormat.LineSpacingRule = 1
    $selection.ParagraphFormat.SpaceAfter = 6
    $selection.ParagraphFormat.FirstLineIndent = Cm 1
  }

  function Add-Body([string]$text) {
    Set-BodyFormat
    $selection.TypeText($text)
    $selection.TypeParagraph()
  }

  function Add-NoIndent([string]$text, [int]$alignment = 0, [bool]$bold = $false, [double]$size = 14) {
    $selection.Style = $doc.Styles.Item(-1)
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = $size
    $selection.Font.Bold = $bold
    $selection.Font.Italic = $false
    $selection.ParagraphFormat.Alignment = $alignment
    $selection.ParagraphFormat.LineSpacingRule = 1
    $selection.ParagraphFormat.SpaceAfter = 6
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.TypeText($text)
    $selection.TypeParagraph()
  }

  function Add-Heading([string]$text, [int]$level = 1) {
    $selection.Style = $doc.Styles.Item(-1 - $level)
    $selection.TypeText($text)
    $selection.TypeParagraph()
  }

  function Add-Blank([int]$count = 1) {
    for ($i = 0; $i -lt $count; $i++) { $selection.TypeParagraph() }
  }

  function Add-PageBreak { $selection.InsertBreak(7) }
  function Add-SectionBreak { $selection.InsertBreak(2) }

  function Add-Table([string[]]$headers, [object[]]$rows, [double[]]$widths) {
    $table = $doc.Tables.Add($selection.Range, $rows.Count + 1, $headers.Count)
    $table.Borders.Enable = 1
    $table.AllowAutoFit = $false
    $table.Range.Font.Name = "Times New Roman"
    $table.Range.Font.Size = 13
    $table.Range.ParagraphFormat.SpaceAfter = 3
    $table.Range.ParagraphFormat.FirstLineIndent = 0
    $table.Range.ParagraphFormat.LineSpacingRule = 0
    $table.Rows.Item(1).Range.Font.Bold = $true
    $table.Rows.Item(1).Range.ParagraphFormat.Alignment = 1
    for ($column = 1; $column -le $headers.Count; $column++) {
      $table.Cell(1, $column).Range.Text = $headers[$column - 1]
      if ($widths.Count -ge $column) { $table.Columns.Item($column).Width = Cm $widths[$column - 1] }
    }
    for ($row = 0; $row -lt $rows.Count; $row++) {
      for ($column = 0; $column -lt $headers.Count; $column++) {
        $table.Cell($row + 2, $column + 1).Range.Text = [string]$rows[$row][$column]
      }
    }
    $selection.SetRange($table.Range.End, $table.Range.End)
    $selection.TypeParagraph()
    return $table
  }

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
    Add-NoIndent "ĐẠI HỌC HUẾ" 1 $true 14
    Add-NoIndent "TRƯỜNG ĐẠI HỌC KHOA HỌC" 1 $true 14
    Add-NoIndent "KHOA CÔNG NGHỆ THÔNG TIN" 1 $true 14
    Add-Blank 3
    Add-NoIndent "HUỲNH HUY" 1 $true 16
    Add-NoIndent "Mã số sinh viên: 22T1020625" 1 $false 14
    Add-Blank 3
    Add-NoIndent "XÂY DỰNG HỆ THỐNG TRỢ LÝ HỌC TẬP CÁ NHÂN STUDYAI ỨNG DỤNG TRÍ TUỆ NHÂN TẠO VÀ KỸ THUẬT RAG" 1 $true 18
    Add-Blank 2
    Add-NoIndent "KHÓA LUẬN TỐT NGHIỆP" 1 $true 16
    if ($inner) {
      Add-NoIndent "Ngành: Công nghệ thông tin" 1 $false 14
      Add-NoIndent "Lớp: Công nghệ thông tin" 1 $false 14
      Add-Blank 2
      Add-NoIndent "GIẢNG VIÊN HƯỚNG DẪN" 1 $true 14
      Add-NoIndent "ĐOÀN THỊ HỒNG PHƯỚC" 1 $true 14
    }
    Add-Blank $(if ($inner) { 3 } else { 7 })
    Add-NoIndent "HUẾ - 2026" 1 $true 14
  }

  # Bìa ngoài và phụ bìa
  Add-Cover $false
  Add-SectionBreak
  Add-Cover $true
  Add-SectionBreak
  Write-Output "PROGRESS=COVERS_DONE"

  # Phần đầu, đánh số La Mã
  Add-Heading "LỜI CAM ĐOAN" 1
  Add-Body "Em xin cam đoan báo cáo với đề tài “Xây dựng hệ thống trợ lý học tập cá nhân StudyAI ứng dụng trí tuệ nhân tạo và kỹ thuật RAG” là kết quả nghiên cứu và triển khai của cá nhân em dưới sự hướng dẫn của giảng viên. Các nội dung tham khảo đều được ghi nguồn trong phần tài liệu tham khảo."
  Add-Body "Mã nguồn, dữ liệu thử nghiệm, kết quả kiểm thử và hình ảnh minh họa được trình bày trung thực. Em chịu trách nhiệm về tính chính xác của nội dung báo cáo và không sao chép kết quả của công trình khác dưới bất kỳ hình thức nào."
  Add-NoIndent "Huế, ngày ..... tháng ..... năm 2026" 2 $false 14
  Add-NoIndent "Sinh viên thực hiện" 2 $true 14
  Add-Blank 3
  Add-NoIndent "HUỲNH HUY" 2 $true 14
  Add-PageBreak
  Add-Heading "LỜI CẢM ƠN" 1
  Add-Body "Trong quá trình thực hiện khóa luận với đề tài “Xây dựng hệ thống trợ lý học tập cá nhân StudyAI ứng dụng trí tuệ nhân tạo và kỹ thuật RAG”, em đã nhận được sự hướng dẫn, hỗ trợ và động viên từ quý thầy cô, gia đình và bạn bè. Em xin bày tỏ lòng biết ơn sâu sắc tới Đoàn Thị Hồng Phước, người đã định hướng chuyên môn, góp ý về phương pháp nghiên cứu và hỗ trợ em trong quá trình xây dựng, kiểm thử và hoàn thiện hệ thống."
  Add-Body "Em trân trọng cảm ơn các thầy cô Khoa Công nghệ Thông tin, Trường Đại học Khoa học - Đại học Huế đã trang bị kiến thức nền tảng về công nghệ phần mềm, cơ sở dữ liệu, phát triển ứng dụng web và trí tuệ nhân tạo. Những kiến thức đó là cơ sở quan trọng để em phân tích bài toán, lựa chọn công nghệ và triển khai sản phẩm trong khóa luận."
  Add-Body "Do thời gian thực hiện và kinh nghiệm nghiên cứu còn hạn chế, khóa luận khó tránh khỏi thiếu sót. Em kính mong nhận được ý kiến đóng góp của quý thầy cô để nội dung nghiên cứu và sản phẩm StudyAI tiếp tục được hoàn thiện."
  Add-NoIndent "Huế, ngày ..... tháng ..... năm 2026" 2 $false 14
  Add-NoIndent "Sinh viên thực hiện" 2 $true 14
  Add-Blank 3
  Add-NoIndent "HUỲNH HUY" 2 $true 14
  Add-PageBreak

  Add-Heading "BẢNG CHỮ CÁI VIẾT TẮT" 1
  $abbrRows = @(
    @("AI", "Artificial Intelligence", "Trí tuệ nhân tạo"),
    @("API", "Application Programming Interface", "Giao diện lập trình ứng dụng"),
    @("CSDL", "Database", "Cơ sở dữ liệu"),
    @("JWT", "JSON Web Token", "Chuẩn token dùng cho xác thực"),
    @("LLM", "Large Language Model", "Mô hình ngôn ngữ lớn"),
    @("NLP", "Natural Language Processing", "Xử lý ngôn ngữ tự nhiên"),
    @("RAG", "Retrieval-Augmented Generation", "Sinh nội dung tăng cường bởi truy xuất"),
    @("REST", "Representational State Transfer", "Kiểu kiến trúc dịch vụ web"),
    @("RPC", "Remote Procedure Call", "Gọi thủ tục từ xa"),
    @("UI/UX", "User Interface/User Experience", "Giao diện và trải nghiệm người dùng")
  )
  Add-Table @("Từ viết tắt", "Tên tiếng Anh", "Ý nghĩa tiếng Việt") $abbrRows @(3.0, 6.3, 5.2) | Out-Null
  Add-PageBreak

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
  Add-PageBreak

  Add-Heading "MỤC LỤC" 1
  $toc = $doc.TablesOfContents.Add($selection.Range, $true, 1, 3)
  $selection.SetRange($toc.Range.End, $toc.Range.End)
  $selection.TypeParagraph()
  Add-SectionBreak
  Write-Output "PROGRESS=FRONT_MATTER_DONE"

  # Nội dung chính, đánh số Ả-rập từ 1
  Add-Heading "CHƯƠNG 1. GIỚI THIỆU ĐỀ TÀI" 1
  Add-Heading "1.1. Lý do chọn đề tài" 2
  Add-Body "Sự phát triển của công nghệ số làm thay đổi rõ rệt cách người học tiếp cận tài liệu, tổ chức kế hoạch và tự đánh giá kết quả học tập. Sinh viên hiện có thể tiếp cận một lượng lớn giáo trình, bài giảng, tài liệu điện tử và nguồn thông tin trực tuyến. Tuy nhiên, khối lượng thông tin tăng nhanh cũng tạo ra khó khăn mới: tài liệu phân tán, thời gian đọc và tổng hợp kéo dài, việc ghi nhớ thiếu hệ thống, trong khi các công cụ quản lý nhiệm vụ và công cụ hỏi đáp thường tồn tại tách rời nhau."
  Add-Body "Các mô hình ngôn ngữ lớn có khả năng tóm tắt, sinh câu hỏi và đối thoại tự nhiên, mở ra khả năng xây dựng trợ lý học tập cá nhân. Dù vậy, mô hình ngôn ngữ có thể trả lời dựa trên tri thức tổng quát thay vì tài liệu người dùng cung cấp, hoặc tạo ra thông tin thiếu căn cứ. Công trình nền tảng về Retrieval-Augmented Generation cho thấy việc kết hợp bộ nhớ tham số của mô hình với nguồn tri thức được truy xuất có thể tạo nội dung cụ thể và giàu căn cứ hơn so với chỉ dùng mô hình sinh [1]."
  Add-Body "Từ nhu cầu đó, đề tài lựa chọn xây dựng StudyAI, một hệ thống web tích hợp quản lý môn học, nhiệm vụ, tài liệu và các công cụ AI. Điểm trọng tâm là quy trình RAG: tài liệu được trích xuất, chia đoạn, tạo vector biểu diễn, truy xuất theo độ tương đồng và đưa các đoạn phù hợp vào ngữ cảnh trả lời. Cách tiếp cận này giúp giới hạn câu trả lời theo tài liệu của người dùng và cung cấp trích dẫn để người học kiểm chứng."

  Add-Heading "1.2. Mục tiêu nghiên cứu" 2
  Add-Body "Mục tiêu tổng quát của đề tài là xây dựng một ứng dụng web hỗ trợ người học quản lý hoạt động học tập và khai thác tài liệu bằng trí tuệ nhân tạo theo hướng có căn cứ, an toàn và dễ sử dụng. Hệ thống cần vận hành được theo mô hình full-stack, lưu trữ dữ liệu lâu dài, phân quyền theo tài khoản và có khả năng mở rộng."
  Add-Body "Các mục tiêu cụ thể gồm: xây dựng chức năng quản lý môn học và nhiệm vụ; cho phép tải lên tài liệu TXT, Markdown, PDF và DOCX; trích xuất và lập chỉ mục nội dung; tạo tóm tắt, flashcard và quiz; quản lý nhiều phiên bản nội dung AI; tìm kiếm từ khóa, ngữ nghĩa và kết hợp; hỏi đáp theo tài liệu bằng RAG kèm nguồn; bảo vệ file trong vùng lưu trữ riêng tư; xác thực bằng JWT; và kiểm thử các nghiệp vụ cốt lõi."

  Add-Heading "1.3. Đối tượng và phạm vi nghiên cứu" 2
  Add-Body "Đối tượng nghiên cứu là quy trình phát triển hệ thống trợ lý học tập trên nền web, kỹ thuật tích hợp mô hình sinh nội dung, phương pháp biểu diễn văn bản bằng embedding, tìm kiếm vector và kiến trúc RAG. Đối tượng sử dụng chính là sinh viên hoặc người tự học có nhu cầu tổ chức môn học, nhiệm vụ và khai thác tài liệu cá nhân."
  Add-Body "Phạm vi sản phẩm tập trung vào tài liệu có thể trích xuất văn bản. Hệ thống hỗ trợ TXT, Markdown, PDF có lớp văn bản và DOCX; chưa xử lý OCR cho PDF chỉ chứa ảnh. Việc lập chỉ mục được thực hiện trực tiếp trong request, chưa sử dụng hàng đợi nền. Hệ thống không triển khai spaced repetition, đánh giá mastery, gợi ý học tập thích nghi hoặc mô hình microservice."

  Add-Heading "1.4. Phương pháp nghiên cứu" 2
  Add-Body "Đề tài sử dụng kết hợp phương pháp nghiên cứu tài liệu, phân tích yêu cầu, thiết kế hệ thống, thực nghiệm và kiểm thử. Tài liệu kỹ thuật chính thức và các công trình về RAG được khảo sát để xác định mô hình xử lý. Yêu cầu được chuyển thành các nhóm chức năng và ràng buộc bảo mật. Hệ thống được thiết kế theo kiến trúc client-server, sau đó hiện thực từng mô-đun và kiểm thử bằng dữ liệu mẫu cùng các tình huống lỗi."

  Add-Heading "1.5. Ý nghĩa khoa học và thực tiễn" 2
  Add-Body "Về mặt học thuật, đề tài minh họa cách kết hợp mô hình ngôn ngữ, embedding và cơ sở dữ liệu vector trong một quy trình RAG có kiểm soát quyền sở hữu dữ liệu. Về mặt thực tiễn, StudyAI tạo một không gian thống nhất để người học quản lý công việc, chuyển tài liệu thành nội dung ôn tập và đặt câu hỏi có nguồn tham khảo, qua đó giảm thao tác chuyển đổi giữa nhiều công cụ."

  Add-Heading "1.6. Bố cục khóa luận" 2
  Add-Body "Ngoài phần mở đầu, kết luận, tài liệu tham khảo và phụ lục, khóa luận dự kiến gồm bốn chương. Chương 1 trình bày tổng quan bài toán và cơ sở lý thuyết. Chương 2 phân tích yêu cầu và thiết kế hệ thống. Chương 3 trình bày quá trình xây dựng, tích hợp và các mô-đun chính. Chương 4 mô tả kiểm thử, đánh giá kết quả và thảo luận các giới hạn."
  Add-PageBreak
  Write-Output "PROGRESS=INTRODUCTION_DONE"

  Add-Heading "CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ LIÊN QUAN" 1
  Add-Heading "2.1. Tổng quan bài toán trợ lý học tập cá nhân" 2
  Add-Heading "2.1.1. Bối cảnh của bài toán" 3
  Add-Body "Trong môi trường đại học, mỗi học phần thường đi kèm đề cương, giáo trình, slide, tài liệu tham khảo, bài tập và lịch đánh giá. Người học phải đồng thời quản lý tiến độ, ghi nhớ khái niệm và chuẩn bị cho các hình thức kiểm tra khác nhau. Khi dữ liệu được lưu ở nhiều thư mục và nền tảng, việc tìm lại thông tin hoặc tổng hợp nội dung trở thành một chi phí đáng kể."
  Add-Body "Một trợ lý học tập cá nhân cần giải quyết đồng thời hai lớp nhu cầu. Lớp thứ nhất là tổ chức: quản lý môn học, nhiệm vụ, thời hạn và tài liệu. Lớp thứ hai là khai thác tri thức: tóm tắt nội dung, tạo câu hỏi ôn tập, tìm kiếm theo ý nghĩa và giải đáp dựa trên tài liệu. Nếu chỉ giải quyết một lớp, người học vẫn phải di chuyển dữ liệu thủ công giữa công cụ quản lý và công cụ AI."

  Add-Heading "2.1.2. Những hạn chế của cách tiếp cận thông thường" 3
  Add-Body "Cách học thủ công có ưu điểm là người học trực tiếp đọc và ghi chú, nhưng tốn thời gian khi tài liệu dài hoặc cần ôn tập nhanh. Tìm kiếm bằng từ khóa chỉ phát hiện chuỗi ký tự giống nhau và có thể bỏ sót đoạn diễn đạt bằng từ đồng nghĩa. Chatbot tổng quát hỗ trợ đối thoại thuận tiện nhưng không mặc nhiên biết nội dung riêng của người dùng; nếu gửi toàn bộ tài liệu vào mỗi câu hỏi, chi phí và độ trễ tăng, đồng thời ngữ cảnh có thể vượt giới hạn của mô hình."
  Add-Body "Một vấn đề khác là khả năng kiểm chứng. Câu trả lời trôi chảy không đồng nghĩa với câu trả lời đúng. Trong học tập, người dùng cần biết thông tin được lấy từ đoạn nào để quay lại đối chiếu. Vì vậy, hệ thống không chỉ cần sinh câu trả lời mà còn phải truy xuất nguồn, ràng buộc ngữ cảnh và lưu citation tương ứng."

  Add-Heading "2.1.3. Định hướng giải pháp StudyAI" 3
  Add-Body "StudyAI được định hướng như một ứng dụng web cá nhân hóa theo tài khoản. Người dùng tạo môn học, nhiệm vụ, tải tài liệu và sử dụng các công cụ AI trên chính dữ liệu của mình. Backend kiểm tra quyền sở hữu ở mọi nghiệp vụ nhận mã đối tượng từ client. File gốc được lưu trong bucket riêng tư; frontend không giữ khóa quản trị Supabase."
  Add-Body "Nội dung tài liệu sau khi trích xuất được chia thành các đoạn có chồng lấn, chuyển thành vector 768 chiều và lưu trong PostgreSQL thông qua pgvector. Khi người dùng đặt câu hỏi, hệ thống tạo embedding cho câu hỏi, tìm các đoạn có độ tương đồng cao, tạo prompt có đánh số nguồn rồi mới gọi Gemini. Câu trả lời và citation được lưu để hiển thị lại."

  Add-Heading "2.2. Trí tuệ nhân tạo và mô hình ngôn ngữ lớn" 2
  Add-Heading "2.2.1. Khái niệm liên quan" 3
  Add-Body "Trí tuệ nhân tạo là lĩnh vực xây dựng hệ thống có khả năng thực hiện những nhiệm vụ thường cần đến năng lực nhận thức của con người, chẳng hạn hiểu ngôn ngữ, suy luận, phân loại và sinh nội dung. Trong phạm vi đề tài, thành phần AI chính là mô hình ngôn ngữ lớn. Mô hình nhận prompt dưới dạng văn bản và sinh chuỗi đầu ra phù hợp với ngữ cảnh."
  Add-Body "Mô hình ngôn ngữ có thể hỗ trợ tóm tắt, tạo flashcard, sinh câu hỏi trắc nghiệm và đối thoại. Tuy nhiên, đầu ra mang tính xác suất, phụ thuộc mạnh vào prompt và dữ liệu ngữ cảnh. Hệ thống ứng dụng vì vậy phải kiểm tra cấu trúc đầu ra, giới hạn dữ liệu đầu vào, xử lý timeout, rate limit và trường hợp mô hình trả nội dung không hợp lệ."

  Add-Heading "2.2.2. Prompt và sinh nội dung có cấu trúc" 3
  Add-Body "Prompt mô tả vai trò, nhiệm vụ, dữ liệu nguồn và định dạng kết quả mong muốn. Với tóm tắt, hệ thống yêu cầu chỉ sử dụng phần nội dung được cung cấp và trình bày ý chính. Với flashcard và quiz, prompt chỉ định số lượng cùng cấu trúc JSON. Backend không tin hoàn toàn đầu ra của mô hình mà phải parse, kiểm tra trường bắt buộc, loại câu trùng và từ chối đáp án ngoài miền hợp lệ."
  Add-Body "Đối với tài liệu dài, việc cắt cố định phần đầu có thể làm mất nội dung quan trọng ở giữa và cuối. StudyAI sử dụng các đoạn phân bố trên toàn tài liệu; riêng tóm tắt dài có thể áp dụng chiến lược phân cấp: tóm tắt từng nhóm đoạn rồi tổng hợp các bản tóm tắt trung gian. Cách làm này giảm nguy cơ bỏ sót toàn bộ phần sau của tài liệu."

  Add-Heading "2.3. Retrieval-Augmented Generation" 2
  Add-Heading "2.3.1. Khái niệm RAG" 3
  Add-Body "Retrieval-Augmented Generation là phương pháp kết hợp mô hình sinh với một nguồn tri thức bên ngoài được truy xuất theo câu hỏi. Lewis và cộng sự mô tả RAG như sự kết hợp giữa bộ nhớ tham số của mô hình sinh và bộ nhớ phi tham số được truy cập bởi bộ truy xuất [1]. Các khảo sát sau đó nhấn mạnh RAG có thể tăng tính cập nhật, độ tin cậy và khả năng tích hợp tri thức theo miền [2]."
  Add-Body "Trong StudyAI, nguồn tri thức không phải kho dữ liệu công cộng mà là tập tài liệu thuộc từng người dùng. Điều này dẫn đến yêu cầu bắt buộc: mọi truy vấn vector phải lọc theo user_id và, khi hỏi theo một tài liệu, lọc thêm document_id. Nếu thiếu điều kiện này, hệ thống có thể làm lộ đoạn nội dung của tài khoản khác."

  Add-Heading "2.3.2. Embedding và không gian vector" 3
  Add-Body "Embedding là biểu diễn số của nội dung trong một không gian nhiều chiều. Các văn bản có quan hệ ngữ nghĩa gần nhau thường có vector gần nhau theo một thước đo như cosine similarity. Tài liệu Gemini cho biết embedding được sử dụng trong tìm kiếm ngữ nghĩa, phân loại, gom cụm và RAG; với trường hợp chỉ xử lý văn bản, gemini-embedding-001 vẫn hỗ trợ đầu ra có số chiều linh hoạt [7]."
  Add-Body "StudyAI sử dụng vector 768 chiều để cân bằng khả năng biểu diễn và dung lượng lưu trữ. Embedding của đoạn tài liệu và embedding của truy vấn phải được tạo bởi cùng một model và cùng cấu hình số chiều. Nếu thay model sang một không gian embedding không tương thích, toàn bộ dữ liệu cũ phải được lập chỉ mục lại trước khi so sánh."

  Add-Heading "2.3.3. Chia đoạn tài liệu" 3
  Add-Body "Tài liệu thường dài hơn lượng ngữ cảnh cần thiết cho một câu hỏi. Vì vậy, hệ thống chia văn bản thành các chunk. Chunk quá ngắn làm mất ngữ cảnh; chunk quá dài làm giảm độ chính xác khi truy xuất và tăng số token đưa vào mô hình. StudyAI ưu tiên ranh giới đoạn và câu, đặt kích thước mục tiêu khoảng 800–1.200 ký tự, có overlap khoảng 150–200 ký tự để hạn chế mất ý tại điểm cắt."
  Add-Body "Mỗi chunk mang chunk_index, vị trí ký tự, ước lượng token, metadata và page_number nếu có thể xác định. Với PDF mà thư viện không ánh xạ được trang, page_number được để null thay vì tự suy đoán. Trích dẫn hiển thị số đoạn và chỉ hiển thị số trang khi dữ liệu thực sự tồn tại."

  Add-Heading "2.3.4. Truy xuất theo độ tương đồng" 3
  Add-Body "Khi người dùng gửi câu hỏi, hệ thống tạo embedding của câu hỏi và gọi hàm PostgreSQL để tìm các vector gần nhất. Độ tương đồng được tính từ khoảng cách cosine, sau đó lọc theo ngưỡng và giới hạn số kết quả. Supabase hỗ trợ pgvector cùng các chỉ mục IVFFlat và HNSW; HNSW phù hợp cho truy vấn đọc nhiều, yêu cầu độ trễ thấp và độ bao phủ cao [6]."
  Add-Body "Các đoạn truy xuất được đánh số [Nguồn 1], [Nguồn 2] trước khi ghép vào prompt. Mô hình được yêu cầu chỉ dùng context và trả về danh sách số nguồn đã sử dụng. Backend đối chiếu danh sách này với tập nguồn thực tế, nhờ đó loại bỏ citation do mô hình tự tạo. Nếu không có đoạn đủ liên quan, hệ thống phải thông báo không tìm thấy thông tin trong tài liệu."

  Add-Heading "2.3.5. Lợi ích và giới hạn của RAG" 3
  Add-Body "RAG giúp cập nhật nguồn tri thức mà không cần huấn luyện lại mô hình, giảm lượng dữ liệu gửi cho mỗi câu hỏi và tạo điều kiện hiển thị nguồn. Đối với StudyAI, lợi ích quan trọng nhất là câu trả lời gắn với tài liệu cá nhân và có thể kiểm chứng. Tuy nhiên, RAG không bảo đảm tuyệt đối: nếu chunking không phù hợp, embedding không phản ánh đúng ngữ nghĩa hoặc ngưỡng truy xuất sai, các đoạn cần thiết vẫn có thể bị bỏ sót."
  Add-Body "Chất lượng cuối cùng phụ thuộc chuỗi nhiều bước gồm trích xuất văn bản, chia đoạn, embedding, truy xuất và sinh câu trả lời. Vì vậy, hệ thống cần trạng thái indexing rõ ràng, nút lập chỉ mục lại, fallback tìm kiếm từ khóa và thông báo lỗi ngắn gọn. Citation được gọi là mức liên quan, không được diễn giải thành độ chính xác của câu trả lời."

  Add-Heading "2.4. Kiến trúc ứng dụng web và các công nghệ nền tảng" 2
  Add-Heading "2.4.1. Kiến trúc client-server và REST API" 3
  Add-Body "StudyAI áp dụng kiến trúc client-server. Frontend chịu trách nhiệm trình bày và tương tác; backend thực thi nghiệp vụ, xác thực, truy cập dữ liệu và gọi dịch vụ AI. Hai phía trao đổi qua REST API bằng JSON. Trong Express, routing xác định cách ứng dụng phản hồi theo đường dẫn và phương thức HTTP, với một hoặc nhiều handler được thực thi khi route phù hợp [4]."
  Add-Body "Việc tách client và server giúp tránh đưa Supabase secret key hay Gemini API key vào trình duyệt. Frontend chỉ giữ JWT của StudyAI. Backend sử dụng middleware để xác thực, kiểm tra dữ liệu, áp dụng rate limiting, thiết lập security headers và chuyển lỗi về một định dạng thống nhất."

  Add-Heading "2.4.2. React và Vite ở tầng giao diện" 3
  Add-Body "React tổ chức giao diện thành các component nhận dữ liệu và mô tả nội dung cần hiển thị [3]. State được dùng cho dữ liệu thay đổi theo tương tác, như người dùng hiện tại, trạng thái tải, kết quả API và biểu mẫu. Cách tiếp cận component giúp tách trang tài liệu, lịch sử phiên bản, citation và quiz thành các phần có thể bảo trì độc lập."
  Add-Body "Vite cung cấp môi trường phát triển nhanh và quy trình build frontend. React Router quản lý điều hướng giữa đăng nhập, dashboard, môn học, nhiệm vụ, tài liệu và tìm kiếm. Axios đóng vai trò client HTTP, tự gắn JWT vào Authorization header trước khi gọi backend."

  Add-Heading "2.4.3. Node.js và Express ở tầng dịch vụ" 3
  Add-Body "Backend được xây dựng bằng JavaScript ES Modules trên Node.js và Express. Cấu trúc gồm route, controller, service, middleware, schema validation và utility. Controller chỉ tiếp nhận request và trả response; các nghiệp vụ như indexing, RAG, AI generation, ownership và storage được đặt trong service. Cách phân tách này giảm lặp mã và hỗ trợ kiểm thử theo mô-đun."
  Add-Body "Express middleware được sử dụng cho CORS, Helmet, parse JSON, rate limiting, xác thực JWT, validation Zod và xử lý lỗi. Upload dùng Multer ở chế độ memory, sau đó kiểm tra phần mở rộng, MIME và magic bytes trước khi đưa file vào private Storage."

  Add-Heading "2.4.4. Supabase PostgreSQL, Storage và pgvector" 3
  Add-Body "PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ đối tượng, hỗ trợ khóa ngoại, giao dịch, truy vấn phức tạp và khả năng mở rộng bằng kiểu dữ liệu, hàm và phương thức index [5]. Supabase cung cấp PostgreSQL được quản lý, REST interface và Storage. Trong StudyAI, dữ liệu tài khoản, môn học, nhiệm vụ, tài liệu, chunk, nội dung AI và lịch sử quiz được lưu trong các bảng quan hệ."
  Add-Body "Extension pgvector bổ sung kiểu vector và toán tử khoảng cách. Hàm match_document_chunks được triển khai dưới dạng RPC để lọc theo quyền sở hữu và trả các đoạn gần nhất. File mới được lưu trong bucket study-documents ở chế độ private; backend tạo signed URL có thời hạn khi người dùng tải file gốc."

  Add-Heading "2.4.5. Gemini API" 3
  Add-Body "Gemini API được dùng cho hai nhóm nhiệm vụ. Nhóm sinh nội dung tạo tóm tắt, flashcard, quiz và câu trả lời. Nhóm embedding biến tài liệu và truy vấn thành vector. Tài liệu chính thức mô tả response sinh văn bản qua candidates và content parts [7], đồng thời cung cấp endpoint embedding phục vụ tìm kiếm và RAG."
  Add-Body "Tên model được cấu hình qua biến môi trường để có thể thay đổi khi vòng đời model cập nhật. Backend đặt timeout, kiểm tra mã HTTP, không ghi API key vào log và trả thông báo thân thiện. Mock mode cung cấp đầu ra xác định để demo và chạy unit test mà không phụ thuộc dịch vụ bên ngoài."

  Add-Heading "2.4.6. Xác thực và bảo mật API" 3
  Add-Body "Mật khẩu được băm bằng bcrypt trước khi lưu. Sau đăng nhập, backend phát JWT chứa id người dùng và tokenVersion. Middleware xác minh chữ ký, lấy lại user từ database và so sánh tokenVersion. Khi đăng xuất, tokenVersion tăng để vô hiệu hóa token cũ. OWASP khuyến nghị JWT phải được bảo vệ tính toàn vẹn bằng chữ ký hoặc MAC và không chấp nhận thuật toán không ký [8]."
  Add-Body "Các biện pháp bổ sung gồm danh sách CORS cho phép, Helmet, rate limit riêng cho auth, AI và upload, kiểm tra quyền sở hữu đối tượng, giới hạn kích thước file và nội dung, sanitize tên file, không public thư mục upload và không trả stack trace cho client. Secret chỉ tồn tại ở backend và file .env không được commit."

  Add-Heading "2.5. Khảo sát và lựa chọn hướng tiếp cận" 2
  Add-NoIndent "Bảng 2.1. So sánh các phương án hỗ trợ học tập bằng công nghệ" 1 $true 13
  $compareRows = @(
    @("Ghi chú và tìm kiếm thủ công", "Dễ triển khai; người học kiểm soát nguồn", "Tốn thời gian; khó tổng hợp tài liệu dài"),
    @("Chatbot AI tổng quát", "Đối thoại tự nhiên; sinh nội dung nhanh", "Không mặc nhiên biết tài liệu riêng; khó kiểm chứng"),
    @("Gửi toàn bộ tài liệu vào prompt", "Có ngữ cảnh tài liệu", "Tốn token; độ trễ cao; khó mở rộng với tài liệu dài"),
    @("StudyAI kết hợp RAG", "Truy xuất đúng đoạn; có citation; dữ liệu theo tài khoản", "Phụ thuộc chất lượng trích xuất, embedding và truy xuất")
  )
  Add-Table @("Phương án", "Ưu điểm", "Hạn chế") $compareRows @(4.0, 5.2, 5.3) | Out-Null
  Add-Body "Từ so sánh trên, đề tài lựa chọn kiến trúc ứng dụng web kết hợp RAG. Giải pháp không thay thế vai trò đọc và đánh giá của người học; AI được xem là công cụ hỗ trợ tổ chức, truy xuất và tạo nội dung ôn tập. Việc hiển thị citation giúp người dùng quay lại nguồn thay vì chấp nhận đầu ra một cách thụ động."

  Add-Heading "2.6. Phạm vi chức năng của hệ thống StudyAI" 2
  Add-NoIndent "Bảng 2.2. Các nhóm chức năng chính của hệ thống StudyAI" 1 $true 13
  $functionRows = @(
    @("Xác thực", "Đăng ký, đăng nhập, đăng xuất, kiểm tra phiên và phân quyền quản trị"),
    @("Quản lý học tập", "Quản lý môn học, nhiệm vụ, thời hạn, lịch học và dashboard"),
    @("Quản lý tài liệu", "Upload, kiểm tra file, trích xuất, lưu private, tải bằng signed URL"),
    @("Lập chỉ mục", "Chia chunk, tạo embedding, lưu pgvector, theo dõi trạng thái và reindex"),
    @("AI generation", "Tóm tắt, flashcard, quiz, chỉnh sửa và quản lý phiên bản active"),
    @("Quiz", "Chọn 1–30 câu, làm bài, chấm điểm ở backend và lưu lần làm"),
    @("RAG chat", "Truy xuất chunk, trả lời theo tài liệu, lưu và hiển thị citation"),
    @("Tìm kiếm", "Keyword, semantic, hybrid và fallback khi embedding lỗi")
  )
  Add-Table @("Nhóm", "Mô tả") $functionRows @(4.0, 10.5) | Out-Null

  Add-Heading "2.7. Kiến trúc tổng thể đề xuất" 2
  Add-Body "Kiến trúc tổng thể gồm bốn lớp. Lớp giao diện React/Vite cung cấp các trang và component. Lớp API Express xử lý xác thực, validation và điều phối nghiệp vụ. Lớp dữ liệu Supabase gồm PostgreSQL, pgvector và private Storage. Lớp AI gọi Gemini cho generation và embedding. Luồng dữ liệu chính có thể biểu diễn như sau: React/Vite → Express API → Supabase PostgreSQL/Storage; đồng thời Express API → Gemini API."
  Add-Body "Luồng upload bắt đầu từ file người dùng, qua validation và trích xuất, sau đó lưu file, tạo document, chia chunk, tạo embedding và cập nhật trạng thái completed. Luồng hỏi đáp bắt đầu từ câu hỏi, tạo embedding truy vấn, gọi RPC tìm chunk, xây dựng context có nguồn, gọi Gemini, kiểm tra citation và lưu lịch sử. Luồng tạo nội dung AI tạo một generation mới ở trạng thái processing; chỉ sau khi nội dung hoàn tất mới activate bằng RPC để bảo đảm mỗi loại có một phiên bản active."

  Add-Heading "2.8. Yêu cầu phi chức năng" 2
  Add-NoIndent "Bảng 2.3. Các yêu cầu phi chức năng chính" 1 $true 13
  $qualityRows = @(
    @("Bảo mật", "Không lộ secret; kiểm tra ownership; bucket private; JWT có khả năng thu hồi"),
    @("Tin cậy", "Không để dữ liệu AI dở dang; generation lỗi không thay phiên bản active"),
    @("Hiệu năng", "Giới hạn số chunk truy xuất; dùng HNSW; tránh gửi toàn bộ tài liệu cho mỗi câu hỏi"),
    @("Khả dụng", "Thông báo trạng thái rõ; có reindex; tìm kiếm fallback sang keyword"),
    @("Bảo trì", "Tách route, controller, service, middleware và schema validation"),
    @("Tương thích", "Giao diện responsive; cấu hình qua biến môi trường; PDF font có fallback")
  )
  Add-Table @("Thuộc tính", "Yêu cầu") $qualityRows @(4.0, 10.5) | Out-Null

  Add-Heading "2.9. Tiểu kết Chương 2" 2
  Add-Body "Chương 2 đã trình bày bối cảnh của bài toán trợ lý học tập cá nhân, hạn chế của các cách tiếp cận thủ công và chatbot tổng quát, đồng thời xác định RAG là hướng phù hợp để khai thác tài liệu có nguồn. Chương cũng phân tích các khái niệm embedding, chunking, truy xuất vector, mô hình ngôn ngữ và các công nghệ nền tảng gồm React, Express, PostgreSQL, Supabase, pgvector và Gemini. Trên cơ sở đó, phạm vi chức năng, kiến trúc tổng thể và các yêu cầu phi chức năng của StudyAI được xác lập làm tiền đề cho giai đoạn phân tích và thiết kế hệ thống ở chương tiếp theo."
  Add-PageBreak

  Add-Heading "CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG" 1
  Add-Heading "3.1. Khảo sát và xác định yêu cầu" 2
  Add-Body "StudyAI được xây dựng cho người học cần quản lý đồng thời môn học, nhiệm vụ, lịch học và tài liệu cá nhân. Qua khảo sát quy trình sử dụng, dữ liệu thường nằm rải rác ở nhiều thư mục; người học phải tự đọc toàn bộ tài liệu để tóm tắt, tạo câu hỏi ôn tập và tìm lại kiến thức. Các chatbot tổng quát hỗ trợ diễn đạt nhanh nhưng không mặc nhiên truy cập được kho tài liệu riêng, do đó câu trả lời khó kiểm chứng nếu không gắn với nguồn cụ thể."
  Add-Body "Từ vấn đề trên, hệ thống cần cung cấp một không gian làm việc thống nhất. Người dùng đăng ký hoặc đăng nhập, tạo môn học, quản lý nhiệm vụ, tải tài liệu lên kho riêng, lập chỉ mục nội dung và sử dụng AI để tóm tắt, tạo flashcard, quiz hoặc hỏi đáp. Mọi thao tác dữ liệu phải gắn với định danh người dùng và backend phải kiểm tra quyền sở hữu trước khi đọc, sửa, xóa hay phát liên kết tải file."

  Add-Heading "3.1.1. Yêu cầu chức năng" 3
  Add-NoIndent "Bảng 3.1. Các yêu cầu chức năng chính" 1 $true 13
  $functionalRows = @(
    @("F01", "Tài khoản", "Đăng ký, đăng nhập, lấy hồ sơ và đăng xuất phía client"),
    @("F02", "Môn học", "Tạo, xem, cập nhật và xóa môn học thuộc người dùng"),
    @("F03", "Nhiệm vụ và lịch", "Theo dõi trạng thái, độ ưu tiên, hạn nộp và lịch học"),
    @("F04", "Tài liệu", "Upload TXT, MD, PDF, DOCX; tải file gốc; xóa tài liệu"),
    @("F05", "Lập chỉ mục", "Trích xuất văn bản, chia chunk, tạo embedding và lưu pgvector"),
    @("F06", "AI học tập", "Sinh tóm tắt, flashcard, quiz và quản lý phiên bản"),
    @("F07", "RAG chat", "Hỏi đáp theo tài liệu, lưu lịch sử và trả citation"),
    @("F08", "Tìm kiếm", "Tìm theo từ khóa, ngữ nghĩa hoặc chế độ hybrid"),
    @("F09", "Quiz", "Làm bài, chấm điểm ở server và lưu lần thử"),
    @("F10", "Quản trị", "Xem số liệu tổng quan theo quyền quản trị")
  )
  Add-Table @("Mã", "Nhóm", "Mô tả") $functionalRows @(2.0, 3.5, 9.0) | Out-Null

  Add-Heading "3.1.2. Yêu cầu phi chức năng" 3
  Add-Body "Về bảo mật, khóa dịch vụ Supabase và Gemini chỉ được đặt trong môi trường backend; mật khẩu được băm; API riêng tư yêu cầu JWT; truy vấn dữ liệu luôn kèm điều kiện user_id. Bucket study-documents được cấu hình private và file chỉ được tải qua signed URL có thời hạn. Hệ thống áp dụng Helmet, CORS theo danh sách cho phép, giới hạn tần suất và kiểm tra kiểu, kích thước file."
  Add-Body "Về khả dụng, giao diện cần phản hồi rõ trạng thái pending, processing, completed hoặc failed; thông báo lỗi không được làm mất phiên làm việc; các thao tác chính phải dễ tìm trên cả màn hình máy tính và thiết bị nhỏ. Về khả năng bảo trì, frontend, route, controller, service và repository được tách trách nhiệm; model AI, kích thước embedding và thông tin kết nối được cấu hình bằng biến môi trường."

  Add-Heading "3.2. Tác nhân và trường hợp sử dụng" 2
  Add-Body "Hệ thống có hai tác nhân chính. Người dùng thông thường sử dụng toàn bộ chức năng học tập trên dữ liệu của chính mình. Quản trị viên kế thừa các quyền cơ bản và có thêm quyền xem thống kê quản trị. Các dịch vụ bên ngoài gồm Supabase Database, Supabase Storage và Gemini API đóng vai trò hạ tầng, không trực tiếp thao tác giao diện."
  Add-NoIndent "Bảng 3.2. Các trường hợp sử dụng tiêu biểu" 1 $true 13
  $useCaseRows = @(
    @("UC01", "Đăng nhập", "Thông tin hợp lệ", "Nhận JWT và hồ sơ người dùng"),
    @("UC02", "Upload tài liệu", "Đã xác thực", "File private và bản ghi tài liệu được tạo"),
    @("UC03", "Lập chỉ mục", "Tài liệu có văn bản", "Các chunk và embedding được lưu"),
    @("UC04", "Tóm tắt AI", "Tài liệu sẵn sàng", "Một phiên bản tóm tắt mới được tạo"),
    @("UC05", "Hỏi đáp RAG", "Đã lập chỉ mục", "Câu trả lời kèm nguồn tham chiếu"),
    @("UC06", "Làm quiz", "Quiz tồn tại", "Điểm và đáp án được chấm phía server"),
    @("UC07", "Tìm kiếm hybrid", "Có dữ liệu", "Danh sách kết quả xếp hạng phù hợp")
  )
  Add-Table @("Mã", "Tên", "Tiền điều kiện", "Kết quả") $useCaseRows @(2.0, 3.2, 4.5, 4.8) | Out-Null

  Add-Heading "3.3. Kiến trúc tổng thể" 2
  Add-Body "Hệ thống áp dụng kiến trúc client-server ba tầng. Tầng trình bày là ứng dụng React chạy trên trình duyệt, quản lý router, form, trạng thái tải và hiển thị kết quả. Tầng nghiệp vụ là REST API Node.js/Express, chịu trách nhiệm xác thực, kiểm tra dữ liệu, điều phối nghiệp vụ, gọi AI và kiểm soát quyền truy cập. Tầng dữ liệu dùng Supabase PostgreSQL, pgvector và Storage private."
  Add-NoIndent "Trình duyệt React/Vite  →  REST API Express  →  Service/Repository  →  PostgreSQL + pgvector" 1 $true 13
  Add-NoIndent "                                                         ↘  Supabase Storage private" 1 $false 13
  Add-NoIndent "                                                         ↘  Gemini generation/embedding" 1 $false 13
  Add-NoIndent "Hình 3.1. Kiến trúc logic của hệ thống StudyAI" 1 $false 12
  Add-Body "Frontend không kết nối trực tiếp bằng service key. Mọi yêu cầu nghiệp vụ đi qua backend và mang Authorization: Bearer token. Cách tổ chức này tạo một điểm kiểm soát tập trung cho validation, rate limit, logging và xử lý lỗi, đồng thời tránh lộ thông tin đặc quyền trong mã JavaScript gửi xuống trình duyệt."

  Add-Heading "3.4. Thiết kế dữ liệu" 2
  Add-Body "Cơ sở dữ liệu được thiết kế theo mô hình quan hệ. Bảng users là gốc của dữ liệu sở hữu; subjects nhóm hoạt động học tập; tasks lưu nhiệm vụ; documents lưu metadata file và trạng thái lập chỉ mục. Nội dung tài liệu được tách sang document_chunks để hỗ trợ tìm kiếm vector. Các sản phẩm AI được lưu trong summaries, flashcards, quizzes và ai_generations nhằm theo dõi phiên bản thay vì ghi đè kết quả cũ."
  Add-NoIndent "Bảng 3.3. Vai trò của các bảng dữ liệu" 1 $true 13
  $entityRows = @(
    @("users", "Tài khoản, vai trò, mật khẩu đã băm"),
    @("subjects", "Môn học thuộc người dùng"),
    @("tasks", "Nhiệm vụ, hạn nộp, độ ưu tiên và trạng thái"),
    @("documents", "Metadata file, storage path, nội dung trích xuất, trạng thái index"),
    @("document_chunks", "Đoạn văn, vị trí, metadata và vector 768 chiều"),
    @("ai_generations", "Loại nội dung AI, số phiên bản, trạng thái và lỗi"),
    @("summaries", "Bản tóm tắt đang dùng và các phiên bản"),
    @("flashcards", "Cặp câu hỏi - câu trả lời phục vụ ôn tập"),
    @("quizzes", "Bộ câu hỏi và đáp án chuẩn lưu phía server"),
    @("quiz_attempts", "Lần làm bài, điểm số và kết quả chi tiết"),
    @("document_chats", "Lịch sử hỏi đáp và citation theo tài liệu"),
    @("study_plans", "Thông tin kế hoạch học tập")
  )
  Add-Table @("Bảng", "Vai trò") $entityRows @(4.8, 9.7) | Out-Null
  Add-Body "Khóa ngoại và chính sách truy cập duy trì tính toàn vẹn. Khi xóa đối tượng cha, dữ liệu phụ thuộc được xử lý theo ràng buộc thiết kế. Chỉ mục thông thường hỗ trợ lọc theo user_id, subject_id và trạng thái; chỉ mục vector HNSW hỗ trợ truy vấn khoảng cách cosine trên embedding. Hàm RPC match_document_chunks nhận vector truy vấn, ngưỡng và số kết quả để trả về các chunk phù hợp."

  Add-Heading "3.5. Thiết kế API" 2
  Add-NoIndent "Bảng 3.4. Một số endpoint quan trọng" 1 $true 13
  $apiRows = @(
    @("POST", "/api/auth/login", "Xác thực và phát JWT"),
    @("GET/POST", "/api/subjects", "Đọc hoặc tạo môn học"),
    @("GET/POST", "/api/tasks", "Quản lý nhiệm vụ"),
    @("POST", "/api/documents", "Upload và tạo tài liệu"),
    @("POST", "/api/documents/:id/reindex", "Lập chỉ mục lại"),
    @("POST", "/api/documents/:id/summaries", "Sinh tóm tắt"),
    @("POST", "/api/documents/:id/flashcards", "Sinh flashcard"),
    @("POST", "/api/documents/:id/quizzes", "Sinh quiz"),
    @("POST", "/api/documents/:id/chat", "Hỏi đáp RAG"),
    @("GET", "/api/search", "Tìm kiếm keyword/semantic/hybrid")
  )
  Add-Table @("Method", "Endpoint", "Mục đích") $apiRows @(2.5, 6.5, 5.5) | Out-Null
  Add-Body "API trả dữ liệu JSON với mã trạng thái HTTP phù hợp. Dữ liệu đầu vào được kiểm tra bằng schema; lỗi nghiệp vụ được chuyển qua middleware tập trung. Với upload, backend dùng multipart/form-data; với tải file private, backend tạo URL ký số ngắn hạn. Các endpoint AI có rate limit riêng vì chi phí và độ trễ cao hơn CRUD thông thường."

  Add-Heading "3.6. Thiết kế các luồng xử lý chính" 2
  Add-Heading "3.6.1. Luồng upload và lập chỉ mục" 3
  Add-Body "Người dùng chọn file và môn học, frontend gửi multipart request. Backend xác thực token, kiểm tra phần mở rộng, MIME và kích thước, sau đó đưa file vào bucket private theo đường dẫn có user_id. Service trích xuất nội dung bằng parser tương ứng, chuẩn hóa khoảng trắng và cập nhật documents. Khi lập chỉ mục, nội dung được chia thành chunk khoảng 800 đến 1.200 ký tự với phần chồng lấn, tạo embedding 768 chiều và lưu theo thứ tự. Trạng thái chuyển lần lượt pending, processing, completed; nếu lỗi, thông điệp được lưu để giao diện cho phép thử lại."

  Add-Heading "3.6.2. Luồng hỏi đáp RAG" 3
  Add-Body "Câu hỏi được tạo embedding bằng cùng model đã dùng cho tài liệu. Backend truy vấn các chunk có độ tương đồng cao, đồng thời có thể kết hợp tìm kiếm từ khóa. Các đoạn được đánh nhãn nguồn, ghép vào prompt cùng yêu cầu chỉ trả lời theo ngữ cảnh. Gemini sinh câu trả lời; backend phân tích citation hợp lệ, lưu hội thoại và trả về nội dung cùng danh sách nguồn. Nếu embedding hoặc tìm kiếm vector lỗi, chế độ hybrid có thể chuyển sang keyword_fallback để duy trì khả năng sử dụng."
  Add-NoIndent "Câu hỏi → embedding → truy xuất chunk → dựng ngữ cảnh → Gemini → câu trả lời + citation" 1 $true 13
  Add-NoIndent "Hình 3.2. Chuỗi xử lý hỏi đáp RAG" 1 $false 12

  Add-Heading "3.6.3. Luồng sinh học liệu và quản lý phiên bản" 3
  Add-Body "Khi tạo tóm tắt, flashcard hoặc quiz, backend lấy nội dung đã trích xuất và dựng prompt yêu cầu đầu ra có cấu trúc. Mỗi lần sinh tạo một bản ghi ai_generations với số phiên bản tăng dần. Kết quả hợp lệ được lưu và có thể đặt làm phiên bản đang dùng. Thiết kế này giữ lịch sử, hỗ trợ so sánh và tránh mất dữ liệu khi người dùng yêu cầu sinh lại. Với quiz, đáp án đúng không được gửi kèm đề cho client; bài làm được chấm ở backend để hạn chế gian lận."

  Add-Heading "3.7. Thiết kế bảo mật" 2
  Add-Body "Cơ chế xác thực dùng JWT có thời hạn. Middleware giải mã token và lấy người dùng hiện hành từ cơ sở dữ liệu; vì vậy token của tài khoản đã bị xóa hoặc thay đổi không còn được chấp nhận. Mật khẩu sử dụng bcrypt. Các route dữ liệu áp dụng kiểm tra quyền sở hữu, không tin vào user_id do client gửi. CORS chỉ cho phép các origin cấu hình, Helmet bổ sung header bảo vệ và rate limiter giảm nguy cơ thử mật khẩu hoặc lạm dụng AI."
  Add-Body "Storage bucket phải ở trạng thái private. Backend dùng service role cho thao tác máy chủ nhưng chỉ phát signed URL sau khi xác minh quyền. File upload được giới hạn định dạng và dung lượng; tên file vật lý được chuẩn hóa để tránh traversal. Biến môi trường thật không được commit; khóa bị chia sẻ phải được rotate. Các migration bổ sung chính sách RLS và quyền RPC nhằm giảm bề mặt truy cập trực tiếp."

  Add-Heading "3.8. Tiểu kết Chương 3" 2
  Add-Body "Chương 3 đã chuyển yêu cầu của StudyAI thành kiến trúc, mô hình dữ liệu, API và các quy trình xử lý cụ thể. Thiết kế nhấn mạnh quyền sở hữu dữ liệu, kho file private, lập chỉ mục có trạng thái, nội dung AI có phiên bản và RAG có citation. Đây là cơ sở để triển khai và đánh giá hệ thống trong chương tiếp theo."
  Add-PageBreak

  Add-Heading "CHƯƠNG 4. TRIỂN KHAI VÀ KẾT QUẢ THỰC NGHIỆM" 1
  Add-Heading "4.1. Môi trường triển khai" 2
  Add-Body "Hệ thống được phát triển trên Windows, sử dụng Node.js 24.15.0 và npm. Frontend dùng React 18, React Router, Axios và Vite 5.4.21. Backend dùng Express theo chuẩn ES Modules. Dữ liệu được đặt trên Supabase PostgreSQL; extension pgvector lưu vector; Storage chứa file tài liệu. Gemini cung cấp model sinh nội dung và model embedding. Trình duyệt được dùng để kiểm thử tích hợp giao diện và API trên localhost."
  Add-NoIndent "Bảng 4.1. Thành phần môi trường thực nghiệm" 1 $true 13
  $envRows = @(
    @("Frontend", "React 18, Vite 5.4.21, React Router, Axios"),
    @("Backend", "Node.js 24.15.0, Express, JavaScript ES Modules"),
    @("Cơ sở dữ liệu", "Supabase PostgreSQL, pgvector"),
    @("Lưu trữ", "Supabase Storage bucket private study-documents"),
    @("AI", "Gemini generation và gemini-embedding-001, vector 768 chiều"),
    @("Bảo mật", "JWT, bcrypt, Helmet, CORS, rate limiting, Zod")
  )
  Add-Table @("Thành phần", "Cấu hình") $envRows @(4.5, 10.0) | Out-Null

  Add-Heading "4.2. Triển khai các mô-đun" 2
  Add-Heading "4.2.1. Frontend" 3
  Add-Body "Frontend tổ chức theo trang và component dùng chung. Router phân tách đăng nhập, dashboard, môn học, nhiệm vụ, lịch, tài liệu và tìm kiếm. Axios interceptor gắn token vào request; tầng xử lý lỗi chuyển thông báo kỹ thuật thành phản hồi phù hợp. Các trang tài liệu hiển thị trạng thái lập chỉ mục, nút thử lại, phiên bản AI đang dùng và nguồn trích dẫn."
  Add-Heading "4.2.2. Backend" 3
  Add-Body "Backend tổ chức route-controller-service-repository. Route định nghĩa endpoint và middleware; controller chuẩn hóa request/response; service thực thi nghiệp vụ; repository tương tác Supabase. Lớp AI đóng gói lời gọi Gemini và chế độ mock phục vụ kiểm thử. Cấu trúc này giúp thay đổi provider hoặc bổ sung queue mà không phải viết lại giao diện API."
  Add-Heading "4.2.3. Cơ sở dữ liệu và Storage" 3
  Add-Body "Các migration tạo bảng, chỉ mục vector, RPC tìm kiếm và chính sách bảo mật. Bucket study-documents được đặt private. File cũ ở local có thể chuyển bằng script migrate:storage. Sau migration, tài liệu cũ cần được lập chỉ mục lại để tạo chunk và embedding theo cấu trúc mới."

  Add-Heading "4.3. Kết quả giao diện" 2
  Add-Figure (Join-Path $scriptDirectory "studyai-login.png") "Hình 4.1. Giao diện đăng nhập StudyAI" 14.0
  Add-Body "Trang đăng nhập yêu cầu email và mật khẩu, hiển thị lỗi rõ ràng và chỉ chuyển vào vùng ứng dụng sau khi backend phát token hợp lệ. Phiên đăng nhập được duy trì ở trình duyệt; khi API trả 401, dữ liệu phiên cũ được xóa để tránh trạng thái giao diện đã đăng nhập nhưng request tiếp tục thất bại."
  Add-Figure (Join-Path $scriptDirectory "studyai-documents.png") "Hình 4.2. Giao diện upload và quản lý tài liệu" 14.0
  Add-Body "Trang tài liệu cho phép chọn môn học, file và theo dõi trạng thái. Người dùng có thể nhận biết tài liệu chưa lập chỉ mục, đang xử lý, đã sẵn sàng hoặc thất bại. Thiết kế trạng thái giúp người dùng biết khi nào các chức năng RAG và tìm kiếm ngữ nghĩa có thể sử dụng."
  Add-Figure (Join-Path $scriptDirectory "studyai-document-detail.png") "Hình 4.3. Chi tiết tài liệu và các công cụ AI" 14.0
  Add-Body "Tại trang chi tiết, người dùng tải file gốc qua signed URL, lập chỉ mục lại, tạo tóm tắt, flashcard, quiz và hỏi đáp. Trạng thái sẵn sàng được hiển thị cạnh tiêu đề. Các phiên bản AI được lưu để người dùng lựa chọn bản đang dùng thay vì mất kết quả cũ khi sinh lại."
  Add-Figure (Join-Path $scriptDirectory "studyai-search.png") "Hình 4.4. Giao diện tìm kiếm tài liệu" 14.0
  Add-Body "Màn hình tìm kiếm cung cấp các chế độ keyword, semantic và hybrid. Kết quả trả về kèm loại chế độ thực tế đã dùng; điều này đặc biệt hữu ích khi semantic gặp lỗi và backend chuyển sang keyword fallback."

  Add-Heading "4.4. Kiểm thử và kết quả" 2
  Add-Heading "4.4.1. Kiểm thử tự động backend" 3
  Add-Body "Bộ kiểm thử backend được chạy bằng npm test trong ngày 18/07/2026. Kết quả 6 trên 6 kiểm thử đạt, không có kiểm thử thất bại. Tổng thời gian thực thi xấp xỉ 280 ms. Các ca kiểm thử tập trung vào những quy tắc dễ gây sai lệch trong RAG và quiz."
  Add-NoIndent "Bảng 4.2. Kết quả kiểm thử backend" 1 $true 13
  $testRows = @(
    @("Chunking", "Giữ thứ tự, không tạo chunk rỗng, có overlap", "Đạt"),
    @("Embedding mock", "Deterministic và đúng 768 chiều", "Đạt"),
    @("Quiz validation", "Phát hiện đáp án trùng hoặc không hợp lệ", "Đạt"),
    @("Question count", "Chỉ chấp nhận từ 1 đến 30 câu", "Đạt"),
    @("Citation parser", "Phân tích đúng nhãn nguồn", "Đạt"),
    @("Mock quiz", "Đúng số lượng và offset", "Đạt")
  )
  Add-Table @("Nhóm", "Mục tiêu", "Kết quả") $testRows @(4.0, 8.5, 2.0) | Out-Null

  Add-Heading "4.4.2. Kiểm tra build frontend" 3
  Add-Body "Lệnh npm run build hoàn tất thành công với Vite 5.4.21. Công cụ xử lý 105 mô-đun trong khoảng 872 ms. Gói kết quả gồm index.html 0,39 kB; CSS 12,04 kB, gzip 3,26 kB; JavaScript 246,91 kB, gzip 79,96 kB. Kết quả xác nhận mã frontend có thể đóng gói cho môi trường production và không phát sinh lỗi biên dịch tại thời điểm kiểm tra."
  Add-NoIndent "Bảng 4.3. Kết quả build frontend" 1 $true 13
  $buildRows = @(
    @("Số mô-đun", "105", "Hoàn tất"),
    @("CSS", "12,04 kB; gzip 3,26 kB", "Hoàn tất"),
    @("JavaScript", "246,91 kB; gzip 79,96 kB", "Hoàn tất"),
    @("Thời gian build", "872 ms", "Hoàn tất")
  )
  Add-Table @("Chỉ số", "Giá trị", "Trạng thái") $buildRows @(4.5, 6.5, 3.5) | Out-Null

  Add-Heading "4.4.3. Kiểm thử luồng nghiệp vụ" 3
  Add-Body "Thử nghiệm tích hợp xác nhận người dùng có thể đăng nhập, upload tài liệu văn bản, lập chỉ mục và nhận trạng thái đã sẵn sàng. Sau khi lập chỉ mục, chức năng tóm tắt tạo được phiên bản mới; giao diện hiển thị bản đang dùng. RAG chat và tìm kiếm chỉ được mở khi tài liệu đủ điều kiện. Signed URL cho phép tải file gốc mà không chuyển bucket sang public."
  Add-NoIndent "Bảng 4.4. Đánh giá các luồng chính" 1 $true 13
  $workflowRows = @(
    @("Đăng nhập và xác minh JWT", "Hoạt động"),
    @("CRUD môn học, nhiệm vụ", "Hoạt động"),
    @("Upload file và Storage private", "Hoạt động"),
    @("Trích xuất và lập chỉ mục RAG", "Hoạt động với file có lớp văn bản"),
    @("Tóm tắt, flashcard, quiz", "Hoạt động khi Gemini được cấu hình"),
    @("Hỏi đáp và citation", "Hoạt động trên tài liệu đã index"),
    @("Keyword/semantic/hybrid search", "Hoạt động; có keyword fallback")
  )
  Add-Table @("Luồng", "Kết quả") $workflowRows @(9.0, 5.5) | Out-Null

  Add-Heading "4.5. Đánh giá" 2
  Add-Body "Kết quả cho thấy StudyAI đáp ứng mục tiêu xây dựng một hệ thống học tập full-stack tích hợp quản lý và AI. Điểm nổi bật là dữ liệu được phân tách theo người dùng, file lưu private, nội dung AI có phiên bản, quiz chấm ở server và câu trả lời RAG có nguồn. Kiến trúc module hóa giúp tiếp tục mở rộng mà không phá vỡ hợp đồng API hiện có."
  Add-Body "Tuy nhiên, thử nghiệm hiện chủ yếu ở quy mô cá nhân và dữ liệu mẫu. Chất lượng tóm tắt, flashcard, quiz và truy xuất phụ thuộc chất lượng văn bản đầu vào, model Gemini, chiến lược chunk và ngưỡng tìm kiếm. Hệ thống chưa có bộ đánh giá RAG chuẩn hóa như precision@k, recall@k hay đánh giá mức độ bám nguồn; chưa đo tải đồng thời; và chưa xử lý OCR cho tài liệu quét."
  Add-Heading "4.6. Tiểu kết Chương 4" 2
  Add-Body "Chương 4 đã mô tả môi trường, cách triển khai các tầng, giao diện thực tế và kết quả kiểm thử. Backend đạt 6/6 ca kiểm thử tự động, frontend build thành công và các luồng cốt lõi hoạt động trên môi trường local kết nối Supabase và Gemini. Những hạn chế quan sát được là cơ sở đề xuất hướng phát triển ở Chương 5."
  Add-PageBreak

  Add-Heading "CHƯƠNG 5. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN" 1
  Add-Heading "5.1. Kết quả đạt được" 2
  Add-Body "Đề tài đã xây dựng được hệ thống StudyAI theo mô hình ứng dụng web full-stack. Sản phẩm tích hợp quản lý môn học, nhiệm vụ, lịch và tài liệu với các công cụ AI phục vụ tự học. Tài liệu TXT, Markdown, PDF có lớp văn bản và DOCX có thể được tải lên, trích xuất, chia đoạn, tạo embedding và lưu trong PostgreSQL/pgvector. Người dùng có thể tạo tóm tắt, flashcard, quiz, làm bài và hỏi đáp theo tài liệu."
  Add-Body "Mục tiêu tăng khả năng kiểm chứng được giải quyết bằng quy trình RAG và citation. Mục tiêu bảo mật dữ liệu cá nhân được hỗ trợ bởi JWT, kiểm tra quyền sở hữu, bucket private, signed URL và việc giữ khóa dịch vụ ở backend. Cơ chế phiên bản cho nội dung AI giúp tránh ghi đè kết quả và tạo nền tảng cho so sánh chất lượng trong tương lai. Bộ kiểm thử backend và kết quả build frontend cho thấy hệ thống đạt mức ổn định phù hợp với phạm vi đồ án."

  Add-Heading "5.2. Hạn chế" 2
  Add-Body "Thứ nhất, tài liệu PDF dạng ảnh chưa được OCR nên không thể lập chỉ mục nếu không có lớp văn bản. Thứ hai, quá trình trích xuất, embedding và sinh nội dung còn chạy đồng bộ trong request; tài liệu lớn hoặc API chậm có thể làm tăng thời gian chờ. Thứ ba, chất lượng truy xuất chưa được đánh giá bằng bộ câu hỏi chuẩn và chưa có bước re-ranking chuyên biệt. Thứ tư, phụ thuộc dịch vụ Gemini làm hệ thống chịu ảnh hưởng của quota, thay đổi model và kết nối mạng."
  Add-Body "Ngoài ra, hệ thống chưa có quan sát vận hành đầy đủ như dashboard log, metric và cảnh báo; chưa kiểm thử tải; trải nghiệm trên thiết bị di động cần tiếp tục đánh giá; và tính cá nhân hóa mới dừng ở dữ liệu theo tài khoản, chưa dùng lịch sử học để điều chỉnh độ khó hoặc đề xuất kế hoạch."

  Add-Heading "5.3. Hướng phát triển" 2
  Add-Body "Trong ngắn hạn, hệ thống nên bổ sung hàng đợi nền cho lập chỉ mục và sinh nội dung, hiển thị tiến độ theo job và cho phép tự động retry. OCR có thể được tích hợp cho tài liệu quét. Pipeline RAG nên bổ sung truy xuất nhiều giai đoạn, re-ranking và bộ đánh giá với câu hỏi - đáp án chuẩn để đo recall, độ đúng citation và mức bám nguồn. Việc cache embedding và kết quả truy xuất giúp giảm độ trễ và chi phí."
  Add-Body "Về học tập cá nhân hóa, StudyAI có thể bổ sung spaced repetition cho flashcard, theo dõi mastery theo chủ đề, đề xuất lịch ôn dựa trên hạn nhiệm vụ và sinh quiz thích nghi. Về vận hành, cần bổ sung log có cấu trúc, metric, kiểm thử end-to-end, CI/CD, backup và quy trình rotate secret. Khi số người dùng tăng, backend có thể tách worker xử lý tài liệu, dùng queue và giới hạn tài nguyên theo tenant."
  Add-Body "Về trải nghiệm, có thể thêm xem trước nội dung và citation theo trang, chỉnh sửa flashcard/quiz trước khi lưu, xuất dữ liệu học tập, hỗ trợ kéo thả nhiều file và thông báo tiến độ thời gian thực. Các cải tiến này tiếp tục giữ nguyên nguyên tắc cốt lõi của đề tài: AI phải hỗ trợ người học khai thác tài liệu nhanh hơn nhưng kết quả cần minh bạch, có nguồn và nằm trong quyền kiểm soát của người dùng."

  Add-Heading "5.4. Kết luận chung" 2
  Add-Body "StudyAI chứng minh tính khả thi của việc kết hợp ứng dụng quản lý học tập với mô hình ngôn ngữ và RAG trong một sản phẩm web. Đề tài không chỉ tạo nội dung tự động mà còn tổ chức dữ liệu, bảo vệ file riêng tư, lưu lịch sử và cung cấp nguồn kiểm chứng. Kết quả đạt được là nền tảng phù hợp để tiếp tục nghiên cứu chất lượng truy xuất, cá nhân hóa và triển khai ở quy mô thực tế."
  Add-PageBreak


  Add-Heading "TÀI LIỆU THAM KHẢO" 1
  $references = @(
    "[1]. Patrick Lewis, Ethan Perez, Aleksandra Piktus và cộng sự (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. Advances in Neural Information Processing Systems 33, trang 9459–9474.",
    "[2]. Yunfan Gao, Yun Xiong, Xinyu Gao và cộng sự (2023). Retrieval-Augmented Generation for Large Language Models: A Survey. arXiv:2312.10997.",
    "[3]. Meta Platforms, Inc. (2026). React Documentation, https://react.dev/ (truy cập ngày 18/07/2026).",
    "[4]. OpenJS Foundation (2026). Express.js Documentation, https://expressjs.com/ (truy cập ngày 18/07/2026).",
    "[5]. PostgreSQL Global Development Group (2026). PostgreSQL Documentation: What Is PostgreSQL?, https://www.postgresql.org/docs/current/intro-whatis.html (truy cập ngày 18/07/2026).",
    "[6]. Supabase, Inc. (2026). Semantic Search with pgvector, https://supabase.com/docs/guides/ai/semantic-search (truy cập ngày 18/07/2026).",
    "[7]. Google LLC (2026). Gemini API Documentation: Text Generation and Embeddings, https://ai.google.dev/gemini-api/docs (truy cập ngày 18/07/2026).",
    "[8]. OWASP Foundation (2026). REST Security Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html (truy cập ngày 18/07/2026)."
  )
  foreach ($reference in $references) { Add-NoIndent $reference 3 $false 14 }
  Add-PageBreak
  Add-Heading "PHỤ LỤC" 1
  Add-Heading "PHỤ LỤC A. CẤU TRÚC MÃ NGUỒN" 2
  Add-NoIndent "frontend/        Ứng dụng React/Vite, trang, component và lớp gọi API" 0 $false 13
  Add-NoIndent "backend/src/     Route, controller, middleware, service, repository và cấu hình" 0 $false 13
  Add-NoIndent "backend/test/    Kiểm thử tự động cho chunking, embedding, quiz và citation" 0 $false 13
  Add-NoIndent "database/        Schema và các migration Supabase/PostgreSQL" 0 $false 13
  Add-NoIndent "sample-data/     Tài liệu văn bản phục vụ thử nghiệm" 0 $false 13
  Add-NoIndent "docs/            Tài liệu kiến trúc, migration và báo cáo" 0 $false 13

  Add-Heading "PHỤ LỤC B. CÁC BIẾN MÔI TRƯỜNG" 2
  Add-Body "Backend cần PORT, JWT_SECRET, JWT_EXPIRES_IN, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_STORAGE_BUCKET, GEMINI_API_KEY, GEMINI_MODEL, GEMINI_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS và GEMINI_USE_MOCK. Báo cáo chỉ liệt kê tên biến, không chứa giá trị bí mật. Frontend cấu hình địa chỉ API qua biến Vite tương ứng."

  Add-Heading "PHỤ LỤC C. QUY TRÌNH KHỞI CHẠY" 2
  Add-NoIndent "1. Backup cơ sở dữ liệu và chạy migration trong Supabase SQL Editor." 0 $false 13
  Add-NoIndent "2. Xác nhận bucket study-documents ở chế độ private." 0 $false 13
  Add-NoIndent "3. Cập nhật backend/.env bằng khóa hợp lệ; không commit file này." 0 $false 13
  Add-NoIndent "4. Tại backend chạy npm install, npm run dev; tại frontend chạy npm install, npm run dev." 0 $false 13
  Add-NoIndent "5. Nếu chuyển file local cũ, chạy npm run migrate:storage trong backend." 0 $false 13
  Add-NoIndent "6. Đăng nhập và dùng nút Lập chỉ mục lại cho tài liệu cũ." 0 $false 13
  Add-PageBreak

  Write-Output "PROGRESS=FULL_REPORT_DONE"

  # Áp dụng thiết lập trang cho tất cả section sau khi đã tạo.
  foreach ($section in $doc.Sections) {
    $section.PageSetup.PaperSize = 7
    $section.PageSetup.TopMargin = Cm 2
    $section.PageSetup.BottomMargin = Cm 2
    $section.PageSetup.LeftMargin = Cm 3.5
    $section.PageSetup.RightMargin = Cm 2
    try {
      $section.Headers.Item(1).LinkToPrevious = $false
      $section.Footers.Item(1).LinkToPrevious = $false
    } catch { }
    $section.Headers.Item(1).Range.Text = ""
    $section.Footers.Item(1).Range.Text = ""
  }

  # Section 3: số La Mã; section 4: số Ả-rập từ 1.
  if ($doc.Sections.Count -ge 3) {
    $frontFooter = $doc.Sections.Item(3).Footers.Item(1)
    $frontFooter.Range.ParagraphFormat.Alignment = 1
    $frontFooter.PageNumbers.RestartNumberingAtSection = $true
    $frontFooter.PageNumbers.StartingNumber = 1
    $frontFooter.PageNumbers.NumberStyle = 2
    $frontFooter.PageNumbers.Add(1, $true) | Out-Null
    $frontFooter.Range.Font.Name = "Times New Roman"
    $frontFooter.Range.Font.Size = 12
  }
  if ($doc.Sections.Count -ge 4) {
    $mainFooter = $doc.Sections.Item(4).Footers.Item(1)
    $mainFooter.Range.ParagraphFormat.Alignment = 1
    $mainFooter.PageNumbers.RestartNumberingAtSection = $true
    $mainFooter.PageNumbers.StartingNumber = 1
    $mainFooter.PageNumbers.NumberStyle = 0
    $mainFooter.PageNumbers.Add(1, $true) | Out-Null
    $mainFooter.Range.Font.Name = "Times New Roman"
    $mainFooter.Range.Font.Size = 12
  }

  Write-Output "PROGRESS=TOC_UPDATE_START"
  foreach ($tableOfContents in $doc.TablesOfContents) { $tableOfContents.Update() }
  Write-Output "PROGRESS=TOC_UPDATE_DONE"
  Write-Output "PROGRESS=FIELDS_UPDATED"

  $doc.SaveAs2([string]$outputDocx, 12)
  Write-Output "PROGRESS=DOCX_SAVED"
  Write-Output "DOCX=$outputDocx"
  Write-Output "PAGES=$($doc.ComputeStatistics(2))"
  Write-Output "WORDS=$($doc.ComputeStatistics(0))"
}
finally {
  if ($doc) { $doc.Close($false) }
  if ($word) { $word.Quit() }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
