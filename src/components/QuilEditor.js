import React, { Component } from 'react';
import ReactQuill, { Quill } from 'react-quill';

import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.bubble.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Delta from 'quill-delta';
import axios from 'axios';
import qs from 'qs';

class QuilEditor extends Component {
	constructor(props) {
		super(props);
		this.lang = props.lang;
		this.state = {
			[`text-${props.lang}`]: '',
			[`spell-${props.lang}`]: [],
			[`spellIndex-${props.lang}`]: [],
			textPosition: [],
		};
		this.timeout =  0;
		this.rteChange = this.rteChange.bind(this);

		this.quillRef = null; // Quill instance
		this.reactQuillRef = null; // ReactQuill component
		this.handleChangeText = this.handleChangeText.bind(this);

		this.modules = {
			toolbar: [
				[{ font: [] }],
				[{ size: ['small', false, 'large', 'huge'] }],
				['bold', 'italic', 'underline'],
				[{ list: 'ordered' }, { list: 'bullet' }],
				[{ align: [] }],
				[{ color: [] }, { background: [] }],
				['clean'],
			],
		};

		this.formats = [
			'font',
			'size',
			'bold',
			'italic',
			'underline',
			'list',
			'bullet',
			'align',
			'color',
			'background',
		];

		this.searchSpell = async() => {
			const text = this.quillRef.getText();
			await axios.post(`http://35.197.120.214:5000/api/v1/spell`,
				qs.stringify({
					text: text,
					lang: this.lang,
				})
			)
			.then((res) => {
				this.state[`spell-${props.lang}`] = res.data;
			})
			.catch((err) => console.log(err));
		};

		this.textFormat = () => {
			const spellState = [];
			console.log(this.state[`spell-${this.lang}`]);
			this.state[`spell-${this.lang}`]?.map((item) => {
				if(item.suggestions.length){
					const startIndex = this.quillRef.getText().indexOf(item.original);
					const endIndex = item.original.length;
					const originalText = item.original;
					console.log(startIndex, endIndex, item.suggestions);
					this.quillRef.formatText(startIndex,startIndex+endIndex, {
						underline: true,
						color: 'red',
					});

					if (this.state[`spellIndex-${this.lang}`].map((item) => item.text !== originalText)) {
						spellState.push({
							text: originalText,
							start: startIndex,
							end: startIndex + endIndex,
						});
					}
				}
				
			});
			this.state[`spellIndex-${this.lang}`] = spellState;
		};
	}
	rteChange = (content, delta, source, editor) => {
		this.state[`text-${this.lang}`] = content;
		if (source === 'user') {
			this.searchSpell();
			
			if (this.timeout) clearTimeout(this.timeout);
			this.timeout = setTimeout(() => {
				this.textFormat();
			}, 1500);
		}
	};

	componentDidMount() {
		this.attachQuillRefs(this.lang, this, this.handleChange);
	}
	componentDidUpdate() {
		this.attachQuillRefs(this.lang, this, this.handleChange);
	}
	attachQuillRefs = (lang, allthis, handleChange) => {
		if (typeof this.reactQuillRef.getEditor !== 'function') return;
		this.quillRef = this.reactQuillRef.getEditor();
		const quill = this.quillRef;

		this.quillRef.on('selection-change', function (range) {
			if (range) {
				const selectText = allthis.state[`spellIndex-${lang}`]?.map((item, key) => {
					if (item.start <= range.index &&item.end >= range.index) {
						allthis.setState({
							textPosition: {
								...quill.getBounds(
									item.start,
									item.start - item.end
								),
								text: item.text,
								start: item.start,
								end: item.end,
							},
						});
					}
				});
			}
		});
	};

	handleChangeText(start, end, text, change) {
		this.quillRef.updateContents(
			new Delta()
				.retain(start) // Keep 'Hello '
				.delete(end - start) // 'World' is deleted
				.insert(change)
		);
		this.setState((prev, props) => {
			return { textPosition: {} };
		});
		this.setState((prev, props) => {
			const filtered = prev[`spell-${props.lang}`].filter(
				(item) => item.original !== text
			);
			return { [`spell-${props.lang}`]: filtered };
		});
	}

	render() {
		return (
			<>
				<ReactQuill
					ref={(el) => {
						this.reactQuillRef = el;
					}}
					theme='snow'
					modules={this.modules}
					formats={this.formats}
					onChange={this.rteChange}
					value={this.state[`text-${this.lang}`] || ''}
				/>
				{Object.keys(this.state.textPosition).length > 0 && (
					<>
						<div className={'spellList'} style={{top: `${this.state.textPosition.top + 60}px`,left: `${this.state.textPosition.left}px`}}>
							{this.state[`spell-${this.lang}`]
								.filter(
									(item) => item.original ==this.state.textPosition.text)[0]?.suggestions?.map((item, key) => (
									<li key={key} onClick={() =>
											this.handleChangeText(
												this.state.textPosition.start,
												this.state.textPosition.end,
												this.state.textPosition.text,
												item
											)
										}
									>
										{item}
									</li>
								))}
							<hr />
							<span>
								<i class='bi bi-journal-bookmark-fill'></i> Add
								To Distionary
							</span>
							<span>
								<i class='bi bi-x-circle'></i> Ignore
							</span>
						</div>
					</>
				)}
			</>
		);
	}
}

export default QuilEditor;
