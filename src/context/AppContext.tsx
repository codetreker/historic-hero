import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Faction, Role, RelationType, Person, HistoricalEvent } from '../types';

export interface AppState {
  selectedFactions: Faction[];
  selectedRoles: Role[];
  selectedRelTypes: RelationType[];
  timeRange: [number, number];
  searchQuery: string;
  highlightedPersonId: string | null;
  selectedPerson: Person | null;
  selectedEvent: HistoricalEvent | null;
  drawerVisible: boolean;
  drawerMode: 'person' | 'event';
}

type Action =
  | { type: 'SET_FACTIONS'; payload: Faction[] }
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'SET_REL_TYPES'; payload: RelationType[] }
  | { type: 'SET_TIME_RANGE'; payload: [number, number] }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_HIGHLIGHT'; payload: string | null }
  | { type: 'SET_SELECTED_PERSON'; payload: Person | null }
  | { type: 'SET_SELECTED_EVENT'; payload: HistoricalEvent | null }
  | { type: 'TOGGLE_DRAWER'; payload: { visible: boolean; mode?: 'person' | 'event' } }
  | { type: 'CLEAR_FILTERS' };

const initialState: AppState = {
  selectedFactions: ['wei'],
  selectedRoles: [],
  selectedRelTypes: [],
  timeRange: [150, 280],
  searchQuery: '',
  highlightedPersonId: null,
  selectedPerson: null,
  selectedEvent: null,
  drawerVisible: false,
  drawerMode: 'person',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FACTIONS':
      return { ...state, selectedFactions: action.payload };
    case 'SET_ROLES':
      return { ...state, selectedRoles: action.payload };
    case 'SET_REL_TYPES':
      return { ...state, selectedRelTypes: action.payload };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_HIGHLIGHT':
      return { ...state, highlightedPersonId: action.payload };
    case 'SET_SELECTED_PERSON':
      return {
        ...state,
        selectedPerson: action.payload,
        drawerVisible: !!action.payload,
        drawerMode: 'person',
      };
    case 'SET_SELECTED_EVENT':
      return {
        ...state,
        selectedEvent: action.payload,
        drawerVisible: !!action.payload,
        drawerMode: 'event',
      };
    case 'TOGGLE_DRAWER':
      return {
        ...state,
        drawerVisible: action.payload.visible,
        ...(action.payload.mode ? { drawerMode: action.payload.mode } : {}),
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        selectedFactions: ['wei'],
        selectedRoles: [],
        selectedRelTypes: [],
        timeRange: [150, 280],
      };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
