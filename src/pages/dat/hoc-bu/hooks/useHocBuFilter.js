import { useState } from "react";

export const useHocBuFilter = (defaultFilters = {}) => {
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
    const [tempFilters, setTempFilters] = useState(defaultFilters);

    const setTempFilter = (key, value) => {
        setTempFilters((prev) => ({ ...prev, [key]: value }));
    };

    const applyFilter = () => {
        setAppliedFilters({ ...tempFilters });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const resetFilter = () => {
        setTempFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    return {
        pagination,
        setPagination,
        appliedFilters,
        tempFilters,
        setTempFilter,
        applyFilter,
        resetFilter,
    };
};