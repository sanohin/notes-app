import {
  createEvent,
  createStore,
  createEffect,
  combine,
  forward
} from "effector";
import { from } from "rxjs";
import { debounceTime } from "rxjs/operators";
import * as api from "../../api";
import { createInitialState, getHtml, addDevtools } from "./utils";

export const $notes = createStore({});
export const $notesList = createStore([]);

export const $selectedNoteId = createStore(null);
export const $selectedNote = combine(
  $notes,
  $selectedNoteId,
  (notes, selectedId) => {
    return notes[selectedId] || null;
  }
);

const debugStores = { $notes, $notesList, $selectedNoteId, $selectedNote };
addDevtools(debugStores);

export const loadNotes = createEffect().use(() => api.getNotes());
export const createNote = createEffect().use(() => api.createNote(""));

export const deleteNote = createEffect().use(id => api.removeNote(id));

export const updateNoteState = createEvent();
const createNoteState = createEvent();

const updateNote = createEffect().use(r => api.updateNote(r));
const _updateNoteStateWithId = updateNoteState.map(e => {
  return { editorState: e, id: $selectedNoteId.getState() };
});

export const setSelectedNote = createEvent();
const createdNoteId = createNote.done.map(({ result }) => result.id);

$notes.on(createNote.done, (state, { result }) => ({
  ...state,
  [result.id]: result
}));

$notes.on(loadNotes.done, (_, { result }) => {
  return result.reduce((acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  }, {});
});

$notes.on(_updateNoteStateWithId, (st, { editorState, id }) => {
  return { ...st, [id]: { ...st[id], editorState } };
});

$notes.on(updateNote.done, (st, { params }) => {
  return { ...st, [params.id]: { ...st[params.id], content: params.content } };
});

from(_updateNoteStateWithId)
  .pipe(debounceTime(500))
  .subscribe(({ id, editorState }) => {
    const content = getHtml(editorState);
    updateNote({ id, content });
  });

$notes.on(createNoteState, (st, id) => {
  const note = st[id];
  if (note.editorState) {
    return st;
  }
  return {
    ...st,
    [id]: { ...st[id], editorState: createInitialState(note.content) }
  };
});

$notes.on(deleteNote.done, (st, { params }) => {
  const { [params]: deletedItem, ...rest } = st;
  return rest;
});

$notesList.on(loadNotes.done, (_, { result }) => {
  return result.map(i => i.id);
});

$selectedNoteId.on(setSelectedNote, (_, p) => p);

$selectedNoteId.on($notesList, (item, list) => {
  if (list.includes(item)) {
    return item;
  }
  return list[0] || null;
});

forward({
  from: createdNoteId,
  to: setSelectedNote
});

$notesList.on(createdNoteId, (s, id) => [id].concat(s));

$notesList.on(deleteNote.done, (s, { params }) =>
  s.filter(el => el !== params)
);

forward({
  from: $selectedNoteId,
  to: createNoteState
});

loadNotes.done.watch(({ result }) => {
  if (!result[0]) {
    createNote();
  }
});
