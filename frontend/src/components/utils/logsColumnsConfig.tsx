import { Tag } from 'antd';
import { Action, ActionColor} from "@/helper/requestLogsVar"

const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: "Asia/Singapore",
    };
    return new Date(dateString).toLocaleString(undefined, options);
};

export const LogsColumns = [
    {
        title: 'Time',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (createdAt: string) => formatDate(createdAt),
        width: '20%', // Adjusted width for Time
    },
    {
        title: 'Staff Name',
        dataIndex: 'staffName',
        key: 'staffName',
        width: '20%', // Wider to accommodate longer names
    },
    {
        title: 'Department',
        dataIndex: 'dept',
        key: 'dept',
        width: '15%', // Standard width for Department
    },
    {
        title: 'Position',
        dataIndex: 'position',
        key: 'position',
        width: '15%', // Slightly narrower for Position
    },
    {
        title: 'Request Type',
        dataIndex: 'requestType',
        key: 'requestType',
        width: '15%', // Narrow for Request Type
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: '15%', // Narrow for Action
        render: (action: Action) => {
            const color = ActionColor[action as keyof typeof ActionColor];
            return <Tag color={color}>{action}</Tag>;
        },
    },
];
