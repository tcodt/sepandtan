export default function pagination(count: number, page: number, limit: number) {
    const totalPage = Math.ceil(count / limit);
    const nextPage = Number(page) + 1;
    const prevPage = Number(page) - 1;
    const pagination: {
        total: number;
        nextPage?: number;
        prevPage?: number;
    } = { total: count, };
    if (nextPage <= totalPage) {
        pagination.nextPage = nextPage;
    }
    if (prevPage > 0) {
        pagination.prevPage = prevPage;
    }
    return pagination;
};
