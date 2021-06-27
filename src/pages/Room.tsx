import { useParams } from 'react-router-dom';

import { Button } from '../components/Button';
import { RoomCode } from '../components/RoomCode';

import logoImg from '../assets/images/logo.svg';
import "../styles/room.scss";
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../hooks/UseAuth';
import { database } from '../services/firebase';

type RoomType = {
  id: string;
}

type FirebaseQuestion = Record<string, {
  author: {
    name: string;
    avatar: string;
  }
  content: string;
  isAnswered: boolean;
  isHighlighted: boolean;
}>

type Question = {
  id: string;
  author: {
    name: string;
    avatar: string;
  }
  content: string;
  isAnswered: boolean;
  isHighlighted: boolean;
}

export function Room (){
  const {user} = useAuth();
  const params = useParams<RoomType>();
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  
  const roomId = params.id

  useEffect(() => {
    const roomRef = database.ref(`rooms/${roomId}`);

    roomRef.on('value', room => {
      const databaseRoom = room.val();
      const firebaseQuestion: FirebaseQuestion = databaseRoom.questions;
      const parsedQuestion = Object.entries(firebaseQuestion ?? {}).map(([key, value]) => {
        return {
          id: key,
          content: value.content,
          author: value.author,
          isHighlighted: value.isHighlighted,
          isAnswered: value.isAnswered
        }
      })

      setTitle(databaseRoom.title);
      setQuestions(parsedQuestion);
    })
  }, [roomId])


  async function handleSendQuestion(event: FormEvent){
    event.preventDefault();

    if(newQuestion.trim() === ''){
      return;
    }

    if(!user){
      throw new Error("You must be logged in")
    }

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar,
      },
      isHighLighted: false,
      isAnswered: false,
    }

    await database.ref(`rooms/${roomId}/questions`).push(question);

    setNewQuestion('');
  }

  return (
   <div id="page-room">
     <header>
      <div className="content">
        <img src={logoImg} alt="Letmeask" />
        <RoomCode code={roomId}/>
      </div>
     </header>

     <main className="content">
       <div className="room-title">
         <h1>Sala {title}</h1>
         {questions.length > 0 && <span>4 perguntas</span>}
       </div>

       <form onSubmit={handleSendQuestion}>
          <textarea 
            placeholder="O que você quer perguntar?"
            onChange={event => setNewQuestion(event.target.value)}
            value={newQuestion}
          />
          <div className="form-footer">
            { !user 
                ? <span>Para enviar uma pergunta, <button>faça seu login</button>.</span> 
                : <div className="user-info">
                    <img src={user.avatar} alt={user.name} />
                    <span>{user.name}</span>
                  </div>
            }
            <Button disabled={!user} type="submit">Enviar pergunta</Button>
          </div>  
       </form>

       {JSON.stringify(questions)}
     </main>
   </div>
  )
}