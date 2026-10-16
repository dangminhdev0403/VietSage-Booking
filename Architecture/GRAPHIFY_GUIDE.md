# Graphify Code Navigation Guide

## 1. Mục đích

Graphify là chỉ mục quan hệ code cục bộ của repository. Dùng graph để tìm symbol, caller, import path và impact set trước khi duyệt filesystem.

Graphify không thay source, OpenAPI, schema, tests hoặc runtime verification. Graph chỉ chọn **working set nhỏ nhất**; source hiện tại vẫn là sự thật triển khai.

## 2. Cài đặt

Máy cần `uv`; Graphify không là dependency của ứng dụng và không sửa `package.json`.

```bash
uv tool install --upgrade graphifyy
```

Trên Hermes/Git Bash, `PYTHONPATH` của agent có thể che executable `uv tool`. Dùng lệnh sạch:

```bash
env -u PYTHONPATH graphify --version
```

Baseline đã kiểm tra: `graphify 0.9.91`. Nếu terminal thông thường không có `PYTHONPATH` chèn sẵn, dùng trực tiếp `graphify`.

## 3. Tạo và cập nhật graph

Từ repository root:

```bash
env -u PYTHONPATH graphify update .
```

Output nằm trong `graphify-out/` và bị Git ignore vì có thể tái tạo. Các artifact chính:

- `graph.json` — graph cho CLI/MCP.
- `manifest.json` — freshness theo file.
- `GRAPH_REPORT.md` — báo cáo kiến trúc rộng.
- `graph.html` — visualization cục bộ.
- `repomix/` — context pack theo từng task.

Dùng `--force` chỉ sau deletion/refactor làm số node giảm có chủ đích. Không chạy `watch` mặc định.

## 4. Graphify-first workflow

Áp dụng cho architecture review, debugging, impact analysis và thay đổi chưa biết rõ caller.

### Bước 1 — Freshness

```bash
git rev-parse HEAD
env -u PYTHONPATH graphify god-nodes --top 10
```

So commit trong `graphify-out/GRAPH_REPORT.md` với `HEAD`. Dirty source mới hơn manifest làm graph **partially stale**; chạy `graphify update .` trước khi dùng graph để kết luận impact.

### Bước 2 — Symbolic anchors

Trích 1–2 anchor kỹ thuật từ yêu cầu: component, hook, controller, service, schema hoặc route handler. Ưu tiên:

```bash
env -u PYTHONPATH graphify explain "BookingsService" --all
env -u PYTHONPATH graphify affected "BookingsService" --depth 2
env -u PYTHONPATH graphify path "AdminPage" "backendFetch"
```

Dùng `query` khi chưa biết symbol hoặc cần traversal rộng:

```bash
env -u PYTHONPATH graphify query "booking authorization" --budget 1500
```

Nếu tên mơ hồ, chọn node từ danh sách candidate; không tăng budget mù quáng. Không đọc toàn bộ `graph.json`.

### Bước 3 — Working set và Repomix

Từ graph, chọn target + caller/import/test/contract trực tiếp. Pack đúng working set:

```bash
npx repomix@latest . \
  --include "path/a.ts,path/b.ts,path/a.spec.ts" \
  --compress --style xml \
  --output graphify-out/repomix/task-scope.xml
```

Sau đó mới đọc exact source ranges. Không pack toàn repo khi graph đã xác định phạm vi.

### Bước 4 — Fallback có giải thích

Chỉ dùng filesystem search rộng hơn khi:

- graph chưa tồn tại hoặc stale;
- symbol/generated file/dynamic import không được index;
- query/path/explain không tìm được seam;
- cần xác minh literal/config không có node.

Trước fallback, ghi rõ gap. Search vẫn phải giới hạn theo module/path; không quét `node_modules`, build output hoặc `graphify-out`.

### Bước 5 — Refresh đúng thời điểm

Sau khi hoàn tất và verify một module/feature có thay đổi quan hệ:

```bash
env -u PYTHONPATH graphify update .
```

Không refresh cho copy/CSS hoặc edit không đổi dependency graph. Regenerate scoped Repomix pack nếu task cần continuation/handoff.

## 5. Architecture review bằng graph

Dùng các tín hiệu sau làm **đầu mối**, không làm verdict tự động:

```bash
env -u PYTHONPATH graphify god-nodes --top 15
env -u PYTHONPATH graphify diagnose multigraph --graph graphify-out/graph.json
env -u PYTHONPATH graphify affected "<symbol>" --depth 2
```

- God node domain/shared helper: kiểm tra leverage và scope; không tách chỉ vì degree cao.
- Low cohesion: kiểm tra module có trộn workflow hay graph chỉ gom config/docs.
- Import cycle: blocker cấu trúc thật nếu source xác nhận.
- Direct page-to-network edge: kiểm tra vi phạm feature/BFF seam.
- Nhiều isolated node config/docs: thường là giới hạn extractor, không tự động là lỗi code.

Mọi đề xuất refactor phải được source xác nhận và có migration path nhỏ. Không dựng folder/layer rỗng chỉ để khớp sơ đồ.

## 6. Baseline repository hiện tại

Graph baseline 2026-10-16:

- 710 nodes, 1.158 edges, 47 communities trên corpus 100 files; 8 file không được extractor phân loại.
- Không có import cycle.
- Graph health: không dangling endpoint, missing endpoint, self-loop hoặc edge collapse.
- Graph phát hiện `AdminPage()` gọi trực tiếp `backendFetch()`; đây là deviation cần đưa về feature resource/BFF thay vì mở rộng pattern.
- Backend module boundaries (`BookingsService`, `CatalogService`, `VietSageSyncService`) đã nhận diện rõ; chưa có lý do tách microservice.

Xem hướng cải thiện cấu trúc trong [`ARCHITECTURE.md`](ARCHITECTURE.md), [`MODULE_MAP.md`](MODULE_MAP.md), [`FRONTEND_GUIDE.md`](FRONTEND_GUIDE.md) và [`BACKEND_GUIDE.md`](BACKEND_GUIDE.md).
