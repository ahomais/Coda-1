import Rete from "rete";
import Sockets from "../sockets";
import { Subject, combineLatest, map } from "rxjs";

export default class AddComponent extends Rete.Component {
	constructor(){
		super("Add");
		this.subscriptions = {};
		this.observable = new Subject();
	}

	async builder(node){
		node
		.addInput(
			new Rete.Input("num", "Num", Sockets.NumValue, true),
		).addOutput(
			new Rete.Output("data", "Num", Sockets.NumValue)
		);
	}

	async worker(node, inputs, outputs){
		outputs.data = {
			name: node.id,
			observable: this.observable
		}

		Object.values(this.subscriptions).forEach(sub => {
			sub.unsubscribe();
		})
		this.subscriptions = {};

		if(inputs.num.length === 1){
			this.subscriptions[inputs.num[0].name] = inputs.num[0].observable.subscribe( (num) => {
				this.observable.next(num);
			});
		}
		else if (inputs.num.length > 1) {
			const observablesToSub = [];

			inputs.num.forEach(input => {
				observablesToSub.push(input.observable);
			})

			this.subscriptions = observablesToSub[0].pipe(
				combineLatest(observablesToSub.slice(1)),
				map( (...vals) => {
					return vals.reduce((acc, val) => acc + val, 0);
				})
			).subscribe(x => {
				this.observable.next(x);
			});

		}
	}
}