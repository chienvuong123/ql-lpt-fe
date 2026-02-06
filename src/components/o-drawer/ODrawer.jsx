import { Drawer } from 'antd';
import { useMemo } from 'react';

import './index.scss';

const PREFIX_TITLE = {
  add: 'Tạo mới',
  edit: 'Chỉnh sửa',
  view: 'Chi tiết',
};

const ODrawer = ({
  children,
  usePrefixTitle,
  title,
  mode,
  maskClosable = false,
  classNames,
  ...props
}) => {
  const getDrawerTitle = useMemo(() => {
    if (!usePrefixTitle || !mode) return title;
    return `${PREFIX_TITLE[mode]} ${title}`;
  }, [mode, usePrefixTitle, title]);

  return (
    <Drawer
      title={getDrawerTitle}
      maskClosable={maskClosable}
      classNames={{
        body: 'pa-0',
        header: 'py-22 px-40 fs-16 fw-500',
        ...classNames,
      }}
      {...props}
    >
      {children}
    </Drawer>
  );
};

export default ODrawer;
