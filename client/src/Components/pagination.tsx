import Pagination from "@mui/material/Pagination";
import type { PaginationProps } from "@mui/material/Pagination";

type Childprops = {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

export default function PaginationComponent(props: Childprops) {
  const handlePagination: PaginationProps["onChange"] = (event, page) => {
    props.onPageChange(page);
  };

  return (
    <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
      <Pagination
        count={props.totalPages}
        page={props.currentPage}
        color="primary"
        onChange={handlePagination}
        style={{ marginTop: "20px" }}
      />
    </div>
  );
}
