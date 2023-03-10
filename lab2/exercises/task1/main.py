from typing import List
from fastapi import FastAPI, HTTPException, status
from enum import Enum
from models import Poll, Question, Answer
from datetime import datetime

app = FastAPI()

db: List[Poll] = [
  Poll(name="Poll", created_at=str(datetime.now()), questions=[
    Question(question="Question 1", answers=[
      Answer(answer="Answer 1"),
      Answer(answer="Answer 2"),
      Answer(answer="Answer 3"),
    ]),
    Question(question="Question 2", answers=[
      Answer(answer="Answer 1"),
      Answer(answer="Answer 2")
  ])])
]

# Create poll
@app.post("/v1/polls", status_code=status.HTTP_201_CREATED)
async def create_poll(poll: Poll):
  poll.created_at = datetime.now()
  db.append(poll)
  return poll
  
# Get all polls
@app.get("/v1/polls")
async def fetch_pools():
  return db
  
# See what is inside the poll
@app.get("/v1/polls/{poll_id}")
async def fetch_poll(poll_id: str):
  for poll in db:
    if str(poll.id) == poll_id:
      return poll
  raise HTTPException(status_code=404, detail="Poll not found")

# Cast a vote in a poll
@app.post("/v1/polls/{poll_id}/vote")
async def vote(poll_id: str, question_id: str, answer_id: str):
  for poll in db:
    if str(poll.id) == poll_id:
      for question in poll.questions:
        if str(question.id) == question_id:
          for answer in question.answers:
            if str(answer.id) == answer_id:
              answer.votes += 1
              poll.updated_at = datetime.now()
              return answer
  raise HTTPException(status_code=404, detail="Answer not found")

# Add a question to a poll
@app.post("/v1/polls/{poll_id}/questions", status_code=status.HTTP_201_CREATED)
async def add_question(poll_id: str, question: Question):
  for poll in db:
    if str(poll.id) == poll_id:
      poll.questions.append(question)
      poll.updated_at = datetime.now()
      return poll
  raise HTTPException(status_code=404, detail="Poll not found")

# Delete a question from a poll
@app.delete("/v1/polls/{poll_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(poll_id: str, question_id: str):
  for poll in db:
    if str(poll.id) == poll_id:
      for question in poll.questions:
        if str(question.id) == question_id:
          poll.questions.remove(question)
          poll.updated_at = datetime.now()
          return None
  raise HTTPException(status_code=404, detail="Question not found")

# Update a question in a poll
@app.put("/v1/polls/{poll_id}/questions/{question_id}", status_code=status.HTTP_200_OK)
async def update_question(poll_id: str, question_id: str, question: Question):
  for poll in db:
    if str(poll.id) == poll_id:
      for q in poll.questions:
        if str(q.id) == question_id:
          if question.question:
            q.question = question.question
          if question.answers:
            q.answers = question.answers
          poll.updated_at = datetime.now()
          return poll
  raise HTTPException(status_code=404, detail="Question not found")

# Delete a poll
@app.delete("/v1/polls/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_poll(poll_id: str):
  for poll in db:
    if str(poll.id) == poll_id:
      db.remove(poll)
      return poll
  raise HTTPException(status_code=404, detail="Poll not found")

# Get results of a poll
@app.get("/v1/polls/{poll_id}/results")
async def get_results(poll_id: str):
  for poll in db:
    if str(poll.id) == poll_id:
      results = []
      for question in poll.questions:
        answers = []
        for answer in question.answers:
          answers.append({
            "answer": answer.answer,
            "votes": answer.votes
          })
        results.append({
          "question": question.question,
          "answers": answers
        })
      return results
  raise HTTPException(status_code=404, detail="Poll not found")
