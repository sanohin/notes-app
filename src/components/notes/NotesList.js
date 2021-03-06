// @flow
import React from "react";
import { useStore } from "effector-react";
import { MenuItem, Text, Ellipsis } from "../ui";
import { $notes, $notesList, $selectedNoteId } from "./state";
import { setSelectedNote, createNote } from "./workflow";
import { useMap } from "./utils";
import { NoteText } from "./styled";

function NoteItem({ id, ...rest }: { id: string }) {
  // not happy with it at all
  const preview = useMap($notes, x => (x[id] ? x[id].preview : ""));
  const onClick = React.useCallback(() => setSelectedNote(id), [id]);
  return (
    <MenuItem onClick={onClick} {...rest}>
      <Text color={!preview ? "muted" : "black"}>
        <Ellipsis>{preview || "Untitled"}</Ellipsis>
      </Text>
    </MenuItem>
  );
}

export function NotesList() {
  const noteIds = useStore($notesList);
  const selected = useStore($selectedNoteId);
  return (
    <>
      <MenuItem onClick={createNote}>Create a note</MenuItem>
      <hr />
      {noteIds.map(el => {
        const isSelected = selected === el;
        return <NoteItem selected={isSelected} key={el} id={el} />;
      })}
    </>
  );
}
