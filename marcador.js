function updateMatchButtonStyles(selectedPoints) {
  const button15 = document.getElementById('button15');
  const button21 = document.getElementById('button21');
	
  if (selectedPoints === 15) {
    button15.classList.add('active');
    button21.classList.remove('active');
  } else if (selectedPoints === 21) {
    button21.classList.add('active');
    button15.classList.remove('active');
  }
}

const messagesHistory = [
  {
    role: "system",
    content: "Eres un asistente que lleva el marcador de un partido de voley playa. Ejemplos: 'Puntuación 1 0 ganando equipo A.', 'Puntuación 0 0 empate.', solamente puedes decirlo así"
  }
];

async function sendMessage() {
  const userInput = document.getElementById('userInput').value;
  if (!userInput.trim()) return;

  addMessage('user', userInput);

  messagesHistory.push({
    role: "user",
    content: userInput
  });

  const assistantResponse = await chatWithOpenAI(messagesHistory);

  addMessage('assistant', assistantResponse);

  // Lee en voz alta la respuesta del asistente
  speak(assistantResponse);

  document.getElementById('userInput').value = '';
}

function addMessage(role, content) {
  const messagesDiv = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.innerText = content;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function chatWithOpenAI(history) {
  const apiKey = document.getElementById('textInput').value; // Reemplaza con tu clave de API de OpenAI
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: history
      })
    });

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Procesar la respuesta similar al código en Python
    const processedMessage = processResponse(assistantMessage);
    history.push({ role: "assistant", content: processedMessage });

    return processedMessage;

  } catch (error) {
    console.error("Error al comunicarse con la API:", error);
    return "Error al obtener respuesta.";
  }
}

function processResponse(response) {
  let A = 0, B = 0;
  if (response.length >= 12) {
    const parts = response.match(/\d+/g);
    if (parts && parts.length >= 2) {
      A = parseInt(parts[0], 10);
      B = parseInt(parts[1], 10);
    }

    document.getElementById('score1').innerText = A;
    document.getElementById('score2').innerText = B;

    const team1 = document.getElementById('team1');
    const team2 = document.getElementById('team2');

    if (A > B) {
      team1.classList.add('winning');
      team2.classList.remove('winning');
    } else if (B > A) {
      team2.classList.add('winning');
      team1.classList.remove('winning');
    } else {
      team1.classList.remove('winning');
      team2.classList.remove('winning');
    }
    let fin=15; let cambio=5;
    const button = document.getElementById('button15'); 
    if (button.classList.contains('active')) {
      fin = 15;
      cambio = 5;
    } else {
      fin = 21;
      cambio = 7;
    }
		
    if (A === 15 || B === 15) {
      response = "Fin del partido. " + response;
      response = response.replace("ganando", "gana el");
    } else if ((A + B) % cambio === 0 && (A !== 0 || B !== 0)) {
      response += " Cambio de campo.";
    }
  }
  return response;
}

// Función para leer en voz alta
function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Configura el idioma a español
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("El navegador no soporta la API de Speech Synthesis");
  }
}

// Función para reconocimiento de voz
function startContinuousRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Tu navegador no soporta reconocimiento de voz");
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'es-ES'; // Configura el idioma a español
  recognition.interimResults = true; // No mostrar resultados intermedios
  recognition.continuous = false; // Reconocimiento continuo
  //recognition.maxAlternatives = 1; // Solo una interpretación de lo dicho

  recognition.start();

  recognition.onresult = (event) => {
    console.log("Dentro");
    let interimTranscript = '';
    let finalTranscript = '';
	
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
	
    document.getElementById('userInput').value = interimTranscript;
	
    if (finalTranscript.toLowerCase().includes("marcador")) {
      const messageStart = finalTranscript.toLowerCase().indexOf("marcador") + 9;
      const messageContent = finalTranscript.substring(messageStart).trim();

      if (messageContent) {
        document.getElementById('userInput').value = messageContent;
        sendMessage();
      }
    }
  };

  recognition.onerror = (event) => {
    document.getElementById('userInput').value = event.error;
    console.error("Error en el reconocimiento de voz:", event.error);
    //recognition.start();
  };

  recognition.onend = () => {
    console.log("Reconocimiento de voz finalizado");
    recognition.start();
  };
}
// Iniciar reconocimiento continuo al cargar la página
window.onload = () => {
  startContinuousRecognition();
};
