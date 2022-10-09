import logo from './logo.svg';
import './App.css';
import QuilEditor from './components/QuilEditor';
import 'bootstrap/dist/css/bootstrap.min.css';

import { Container, Row, Col } from 'react-bootstrap';

function App() {
	const lang = ['fr','it','en'];

	return (
		<div className='App'>
			<Container className='mt-5'>
				{lang.map((item, key) => (
					<Row key={key} className='mb-5'>
						<h3>Editor {item}</h3>
						<Col className='editor'>
							<QuilEditor lang={item} />
						</Col>
					</Row>
				))}
			</Container>
		</div>
	);
}

export default App;
