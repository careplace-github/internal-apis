import { Document, Schema, Types } from 'mongoose';

interface Event {
  _id: string;
  series?: string;
  user?: string;
  company?: string;
  order?: string;
  caregiver?: {
    _id: string;
    name: string;
    profile_picture: string;
  },
  type: 'company' | 'personal';
  start: Date;
  end: Date;
  title: string;
  description: string;
  location: string;
  textColor: string;
  allDay: boolean;
}

export default Event;
