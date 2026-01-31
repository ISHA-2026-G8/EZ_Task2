import { useEffect, useState } from 'react'

type CardItem = {
  id: string
  title: string
}

type ColumnItem = {
  id: string
  title: string
  color: string
  cards: CardItem[]
}

type DragPayload = {
  fromColumnId: string
  cardId: string
}

type Drafts = Record<string, string>

const makeId = (): string =>
  (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
  `id_${Math.random().toString(36).slice(2, 10)}`

const initialColumns: ColumnItem[] = [
  {
    id: 'todo',
    title: 'Todo',
    color: '#1d8cf8',
    cards: [
      { id: 'todo-1', title: 'Create initial project plan' },
      { id: 'todo-2', title: 'Design landing page' },
      { id: 'todo-3', title: 'Review codebase structure' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: '#f59f0b',
    cards: [
      { id: 'progress-1', title: 'Implement authentication' },
      { id: 'progress-2', title: 'Set up database schema' },
      { id: 'progress-3', title: 'Fix navbar bugs' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    color: '#12b981',
    cards: [
      { id: 'done-1', title: 'Organize project repository' },
      { id: 'done-2', title: 'Write API documentation' },
    ],
  },
]

function moveCardState(
  prev: ColumnItem[],
  fromColumnId: string,
  toColumnId: string,
  cardId: string,
  toIndex: number
): ColumnItem[] {
  const next = prev.map((column) => ({
    ...column,
    cards: [...column.cards],
  }))
  const fromColumn = next.find((column) => column.id === fromColumnId)
  const toColumn = next.find((column) => column.id === toColumnId)
  if (!fromColumn || !toColumn) return prev

  const fromIndex = fromColumn.cards.findIndex((card) => card.id === cardId)
  if (fromIndex === -1) return prev

  const [card] = fromColumn.cards.splice(fromIndex, 1)
  let insertIndex = toIndex
  if (fromColumnId === toColumnId && fromIndex < insertIndex) {
    insertIndex -= 1
  }
  insertIndex = Math.max(0, Math.min(insertIndex, toColumn.cards.length))
  toColumn.cards.splice(insertIndex, 0, card)

  return next
}

type CardProps = {
  card: CardItem
  columnId: string
  onDelete: (columnId: string, cardId: string) => void
  onEdit: (columnId: string, cardId: string, title: string) => void
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    columnId: string,
    cardId: string
  ) => void
  onDragEnd: () => void
  onDropCard: (
    event: React.DragEvent<HTMLDivElement>,
    columnId: string,
    cardId: string
  ) => void
  isDragging: boolean
}

function Card({
  card,
  columnId,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
  onDropCard,
  isDragging,
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(card.title)

  useEffect(() => {
    setDraft(card.title)
  }, [card.title])

  const commitEdit = () => {
    const nextTitle = draft.trim()
    if (nextTitle) {
      onEdit(columnId, card.id, nextTitle)
    } else {
      setDraft(card.title)
    }
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setDraft(card.title)
    setIsEditing(false)
  }

  return (
    <div
      className={`card-item ${isDragging ? 'is-dragging' : ''}`}
      draggable={!isEditing}
      onDragStart={(event) => onDragStart(event, columnId, card.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropCard(event, columnId, card.id)}
      onDoubleClick={() => setIsEditing(true)}
    >
      <div className="card-title">
        {isEditing ? (
          <input
            className="card-edit-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEdit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitEdit()
              if (event.key === 'Escape') cancelEdit()
            }}
            autoFocus
          />
        ) : (
          <span>{card.title}</span>
        )}
      </div>
      <button
        className="icon-button danger"
        onClick={() => onDelete(columnId, card.id)}
        aria-label="Delete card"
        type="button"
      >
        &#128465;
      </button>
    </div>
  )
}

type ColumnProps = {
  column: ColumnItem
  draftTitle: string
  setDraftTitle: (columnId: string, value: string) => void
  onAddCard: (columnId: string) => void
  onDeleteCard: (columnId: string, cardId: string) => void
  onEditCard: (columnId: string, cardId: string, title: string) => void
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    columnId: string,
    cardId: string
  ) => void
  onDragEnd: () => void
  onDropColumn: (event: React.DragEvent<HTMLElement>, columnId: string) => void
  onDropCard: (
    event: React.DragEvent<HTMLDivElement>,
    columnId: string,
    cardId: string
  ) => void
  draggingCardId: string | null
}

function Column({
  column,
  draftTitle,
  setDraftTitle,
  onAddCard,
  onDeleteCard,
  onEditCard,
  onDragStart,
  onDragEnd,
  onDropColumn,
  onDropCard,
  draggingCardId,
}: ColumnProps) {
  return (
    <section
      className="column"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDropColumn(event, column.id)}
    >
      <header className="column-header" style={{ backgroundColor: column.color }}>
        <div>
          <h2>{column.title}</h2>
          <span className="column-count">{column.cards.length}</span>
        </div>
        <span className="column-accent" />
      </header>

      <form
        className="add-card"
        onSubmit={(event) => {
          event.preventDefault()
          onAddCard(column.id)
        }}
      >
        <input
          className="add-card-input"
          placeholder="Add new card"
          value={draftTitle}
          onChange={(event) => setDraftTitle(column.id, event.target.value)}
        />
        <button className="add-card-button" type="submit">
          + Add
        </button>
      </form>

      <div className="card-list">
        {column.cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            columnId={column.id}
            onDelete={onDeleteCard}
            onEdit={onEditCard}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropCard={onDropCard}
            isDragging={draggingCardId === card.id}
          />
        ))}
      </div>
    </section>
  )
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns)
  const [drafts, setDrafts] = useState<Drafts>(() =>
    Object.fromEntries(initialColumns.map((column) => [column.id, '']))
  )
  const [dragging, setDragging] = useState<DragPayload | null>(null)

  const setDraftTitle = (columnId: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [columnId]: value }))
  }

  const handleAddCard = (columnId: string) => {
    const title = (drafts[columnId] || '').trim()
    if (!title) return
    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: [...column.cards, { id: makeId(), title }],
            }
          : column
      )
    )
    setDrafts((prev) => ({ ...prev, [columnId]: '' }))
  }

  const handleDeleteCard = (columnId: string, cardId: string) => {
    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
          : column
      )
    )
  }

  const handleEditCard = (columnId: string, cardId: string, title: string) => {
    setColumns((prev) =>
      prev.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards.map((card) =>
                card.id === cardId ? { ...card, title } : card
              ),
            }
          : column
      )
    )
  }

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    fromColumnId: string,
    cardId: string
  ) => {
    setDragging({ fromColumnId, cardId })
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ fromColumnId, cardId })
    )
  }

  const handleDragEnd = () => {
    setDragging(null)
  }

  const handleDropColumn = (event: React.DragEvent<HTMLElement>, toColumnId: string) => {
    event.preventDefault()
    let payload = dragging
    if (!payload) {
      try {
        payload = JSON.parse(event.dataTransfer.getData('text/plain')) as DragPayload
      } catch (error) {
        payload = null
      }
    }
    if (!payload) return

    setColumns((prev) =>
      moveCardState(
        prev,
        payload.fromColumnId,
        toColumnId,
        payload.cardId,
        prev.find((column) => column.id === toColumnId)?.cards.length || 0
      )
    )
    setDragging(null)
  }

  const handleDropCard = (
    event: React.DragEvent<HTMLDivElement>,
    toColumnId: string,
    toCardId: string
  ) => {
    event.preventDefault()
    let payload = dragging
    if (!payload) {
      try {
        payload = JSON.parse(event.dataTransfer.getData('text/plain')) as DragPayload
      } catch (error) {
        payload = null
      }
    }
    if (!payload) return

    setColumns((prev) => {
      const column = prev.find((item) => item.id === toColumnId)
      if (!column) return prev
      const toIndex = column.cards.findIndex((card) => card.id === toCardId)
      if (toIndex === -1) return prev
      return moveCardState(
        prev,
        payload.fromColumnId,
        toColumnId,
        payload.cardId,
        toIndex
      )
    })
    setDragging(null)
  }

  return (
    <div className="kanban-app">
      <header className="board-header">
        <div>
          <h1>Project Board</h1>
          <p>Drag cards across columns, double-click to edit, or add new tasks.</p>
        </div>
      </header>

      <main className="board">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            draftTitle={drafts[column.id] || ''}
            setDraftTitle={setDraftTitle}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onEditCard={handleEditCard}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropColumn={handleDropColumn}
            onDropCard={handleDropCard}
            draggingCardId={dragging?.cardId || null}
          />
        ))}
      </main>
    </div>
  )
}
