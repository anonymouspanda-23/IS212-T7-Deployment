import React from 'react';
import { Table, Typography, Tag } from 'antd';

const { Title } = Typography;

interface EventTableGroupProps {
    sortedDates: string[];
    groupedData: Record<string, any[]>;
    columns: any[];
}

const EventTableGroup: React.FC<EventTableGroupProps> = ({ sortedDates, groupedData, columns }) => {
    return (
        <div>
            {sortedDates.length === 0 ? (
            <div style={{ textAlign: 'center', margin: '20px' }}>
                <Title level={5} style={{ color: 'gray' }}>No Data Available</Title>
            </div>
        ) : (
            sortedDates.map((date) => {
                const eventDate = new Date(date);
                const currentDate = new Date();
                // Calculate the difference in time
                const timeDiff = eventDate.getTime() - currentDate.getTime();
                // Convert time difference from milliseconds to days
                const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                // Check if the date is in the past
                const isPastDate = eventDate < currentDate;

                return (
                    <div key={date} style={{ marginBottom: '20px' }}>
                        <Title
                            level={5}
                            style={{
                                margin: 10,
                                display: 'flex', // Align the text horizontally
                                alignItems: 'center', // Vertically center items
                                color: isPastDate ? 'gray' : '', // Change color for past dates
                            }}
                        >
                            <span style={{ fontWeight: 'bold' }}>
                                {eventDate.toLocaleDateString("en-CA", {
                                    timeZone: "Asia/Singapore",
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    weekday: 'short',
                                })}
                            </span>
                            {!isPastDate && (
                                <Tag color="blue" style={{ marginLeft: '0.5rem' }}>
                                    {dayDiff > 1 ? `In ${dayDiff} days` : dayDiff === 1 ? 'In 1 day' : 'Today'}
                                </Tag>
                            )}
                        </Title>
                        <Table
                            columns={columns}
                            dataSource={groupedData[date]}
                            pagination={false}
                            rowKey={(record) => record.staffName + record.requestedDate} // Unique row key
                            tableLayout="fixed" // Ensure the table layout is fixed
                            style={{ display: 'flex' }} // Use flexbox for the table
                        />
                    </div>
                );
            })
        )}
        </div>
    );
};

export default EventTableGroup;
