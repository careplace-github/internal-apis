import { Document } from 'mongoose';

interface EventSeries extends Document {
  user?: string;
  company?: string;
  order?: string;
  start_date: Date;
  // 1 -> Weekly (every 1 week)
  // 2 -> Biweekly (every 2 weeks)
  // 4 -> Monthly (every 4 weeks)
  recurrency_type: 1 | 2 | 4;
  schedule: {
    start: Date;
    end: Date;
  }[];
  end_series: {
    // 0 = never, 1 = on date, 2 = after occurrences
    ending_type: 0 | 1;
    end_date?: Date;
    end_occurrences?: number;
  };
  title: string;
  description: string;
  location: string;
  textColor: string;
  allDay: boolean;
}

export default EventSeries;
