export default function CitationList({ citations = [] }) {
  if (!citations.length) return null;
  return (
    <div className="citations">
      <strong>Nguồn tham khảo</strong>
      {citations.map((citation, index) => (
        <div className="citation" key={citation.chunk_id || index}>
          <div><b>[{index + 1}] {citation.document_title || "Tài liệu"}</b></div>
          <small>{citation.page_number ? `Trang ${citation.page_number} · ` : ""}Đoạn {Number(citation.chunk_index) + 1} · Mức liên quan {Number(citation.similarity || 0).toFixed(2)}</small>
          <p>“{citation.excerpt}”</p>
        </div>
      ))}
    </div>
  );
}

