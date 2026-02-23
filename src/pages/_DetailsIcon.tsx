import React from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function DetailsIcon(props: { fontSize?: 'small' | 'inherit' | 'large' | 'medium'; color?: string }) {
  return <InfoOutlinedIcon fontSize={props.fontSize || 'small'} sx={{ color: props.color || '#1976d2' }} />;
}
