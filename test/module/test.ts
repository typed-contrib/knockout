import * as ko from "knockout";
declare var $;

function test_creatingVMs() {
    const myViewModel = {
        personName: ko.observable('Bob'),
        personAge: ko.observable(123)
    };
    
    ko.applyBindings(myViewModel);
    ko.applyBindings(myViewModel, document.getElementById('someElementId'));

    myViewModel.personName();
    myViewModel.personName('Mary');
    myViewModel.personAge(50);

    const subscription = myViewModel.personName.subscribe(newValue => {
        alert("The person's new name is " + newValue);
    });

    subscription.dispose();
}

function test_computed() {
    class AppViewModel {
        public firstName = ko.observable("Bob");
        public lastName = ko.observable("Smith");
        
        public fullName = ko.pureComputed(() => this.firstName() + " " + this.lastName());
    }
    
    class MyViewModel {
        public firstName = ko.observable("Planet");
        public lastName = ko.observable("Earth");
        
        public fullName = ko.pureComputed({
            read: () => this.firstName() + " " + this.lastName(),
            write: (value) => {
                const lastSpacePos = value.lastIndexOf(" ");
                if (lastSpacePos > 0) {
                    this.firstName(value.substring(0, lastSpacePos));
                    this.lastName(value.substring(lastSpacePos + 1));
                }
            }
        });
    }
    
    class MyViewModel1 {
        public price = ko.observable(25.99);
        
        public formattedPrice = ko.pureComputed({
            read: () => "$" + this.price().toFixed(2),
            write: value => {
                const num = parseFloat(value.replace(/[^\.\d]/g, ""));
                this.price(isNaN(num) ? 0 : num);
            }
        });
    }
    
    class MyViewModel2 {
        public acceptedNumericValue = ko.observable(123);
        public lastInputWasValid = ko.observable(true);

        public attemptedValue = ko.computed<number>({
            read: this.acceptedNumericValue,
            write: function (value) {
                if (isNaN(value))
                    this.lastInputWasValid(false);
                else {
                    this.lastInputWasValid(true);
                    this.acceptedNumericValue(value);
                }
            },
            owner: this
        });
    }

    ko.applyBindings(new MyViewModel());
}

class GetterViewModel {
    private _selectedRange = ko.observable();
    public range = ko.observable();
}

function testGetter() {
    const model = new GetterViewModel();

    model.range.subscribe((range: number) => {
        console.log(range);
    });
}

function test_observableArrays() {
    const myObservableArray = ko.observableArray<any>();
    myObservableArray.push('Some value');
    
    const anotherObservableArray = ko.observableArray([
        { name: "Bungle", type: "Bear" },
        { name: "George", type: "Hippo" },
        { name: "Zippy", type: "Unknown" }
    ]);

    myObservableArray().length;
    myObservableArray()[0];

    myObservableArray.indexOf('Blah');
    
    myObservableArray.push('Some new value');
    myObservableArray.pop();
    
    myObservableArray.unshift('Some new value');
    myObservableArray.shift();
    
    myObservableArray.reverse();
    myObservableArray.sort((left, right) => left == right ? 0 : (left < right ? -1 : 1));
    
    myObservableArray.splice(1, 3);

    myObservableArray.remove('Blah');
    myObservableArray.remove(item => item.age < 18);
    
    myObservableArray.removeAll(['Chad', 132, undefined]);
    myObservableArray.removeAll();
    
    myObservableArray.destroy('Blah');
    myObservableArray.destroy(someItem => someItem.age < 18);
    myObservableArray.destroyAll(['Chad', 132, undefined]);
    
    myObservableArray.destroyAll();

    ko.utils.arrayForEach(anotherObservableArray(), item => {
        console.log(item.name);
    });
}

// You have to extend knockout for your own handlers
declare module "knockout" {
    export interface BindingHandlers {
        yourBindingName: BindingHandler;
        slideVisible: BindingHandler;
        allowBindings: BindingHandler;
        withProperties: BindingHandler;
        randomOrder: BindingHandler;
    }
}

function test_bindings() {
    const currentProfit = ko.observable(150000);
    ko.applyBindings({
        people: [
            { firstName: 'Bert', lastName: 'Bertington' },
            { firstName: 'Charles', lastName: 'Charlesforth' },
            { firstName: 'Denise', lastName: 'Dentiste' }
        ]
    });
    
    const viewModel = { availableCountries: ko.observableArray(['France', 'Germany', 'Spain']) };
    viewModel.availableCountries.push('China');

    ko.bindingHandlers.yourBindingName = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        	return { "controlsDescendantBindings": true };
        }
    };
    
    ko.bindingHandlers.slideVisible = {
        update: function (element, valueAccessor, allBindingsAccessor) {
            const
                value = valueAccessor(), allBindings = allBindingsAccessor(),
                valueUnwrapped = ko.utils.unwrapObservable(value),
                duration = allBindings.slideDuration || 400;
                
            if (valueUnwrapped == true)
                $(element).slideDown(duration);
            else
                $(element).slideUp(duration);
        },
        init: function (element, valueAccessor) {
            const value = ko.utils.unwrapObservable(valueAccessor());
            $(element).toggle(value);
        }
    };
    
    ko.bindingHandlers.hasFocus = {
        init: function (element, valueAccessor) {
            $(element)
                .focus(() => {
                    const value = valueAccessor();
                    value(true);
                })
                .blur(() => {
                    const value = valueAccessor();
                    value(false);
                });
        },
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            if (ko.utils.unwrapObservable(value))
                element.focus();
            else
                element.blur();
        }
    };
    
    ko.bindingHandlers.allowBindings = {
        init: function (elem, valueAccessor) {
            var shouldAllowBindings = ko.utils.unwrapObservable(valueAccessor());
            return { controlsDescendantBindings: !shouldAllowBindings };
        }
    };
    
    ko.bindingHandlers.withProperties = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            const
                newProperties = valueAccessor(),
                innerBindingContext = bindingContext.extend(newProperties);
                
            ko.applyBindingsToDescendants(innerBindingContext, element);
            
            return { controlsDescendantBindings: true };
        }
    };
    
    ko.bindingHandlers.withProperties = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var newProperties = valueAccessor(),
                childBindingContext = bindingContext.createChildContext(viewModel);
                
            ko.utils.extend(childBindingContext, newProperties);
            ko.applyBindingsToDescendants(childBindingContext, element);
            
            return { controlsDescendantBindings: true };
        }
    };
    
    ko.bindingHandlers.randomOrder = {
        init: function (elem, valueAccessor) {
            var child = ko.virtualElements.firstChild(elem),
                childElems = [];
                
            while (child) {
                childElems.push(child);
                child = ko.virtualElements.nextSibling(child);
            }
            
            ko.virtualElements.emptyNode(elem);
            
            while (childElems.length) {
                var randomIndex = Math.floor(Math.random() * childElems.length),
                    chosenChild = childElems.splice(randomIndex, 1);
                ko.virtualElements.prepend(elem, chosenChild[0]);
            }
        }
    };

    let node, containerElem, nodeToInsert, insertAfter, nodeToPrepend, arrayOfNodes;
    ko.virtualElements.emptyNode(containerElem);
    ko.virtualElements.firstChild(containerElem);
    ko.virtualElements.insertAfter(containerElem, nodeToInsert, insertAfter);
    ko.virtualElements.nextSibling(node);
    ko.virtualElements.prepend(containerElem, nodeToPrepend);
    ko.virtualElements.setDomNodeChildren(containerElem, arrayOfNodes);
}

// Have to define your own extenders
interface KnockoutExtenders {
    logChange(target, option);
    numeric(target, precision);
    required(target, overrideMessage);
}

declare module "knockout" {
    export interface ObservableArrayFunctions<T> {
        filterByProperty(propName, matchValue): ko.Computed<any>;
    }
    
    export interface Extenders {
        logChange(target: ko.Subscribable<any>, option: string);
        numeric(target: ko.Subscribable<any>, precision: number);
        required(target: ko.Subscribable<any>, overrideMessage: string);
    }
}

declare const validate;

function test_more() {
    const viewModel = {
        firstName: ko.observable("Bert"),
        lastName: ko.observable("Smith"),
        pets: ko.observableArray(["Cat", "Dog", "Fish"]),
        type: "Customer",
        hasALotOfPets: <any>null
    };
    
    viewModel.hasALotOfPets = ko.computed(() => viewModel.pets().length > 2);
    
    const plainJs = ko.toJS(viewModel);

    ko.extenders.logChange = function (target, option) {
        target.subscribe((newValue) => {
            console.log(option + ": " + newValue);
        });
        
        return target;
    };

    ko.extenders.numeric = function (target, precision) {
        var result = ko.computed<any>({
            read: target,
            write: (newValue) => {
                var current = target(),
                    roundingMultiplier = Math.pow(10, precision),
                    newValueAsNum = isNaN(newValue) ? 0 : parseFloat(newValue),
                    valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

                if (valueToWrite !== current) {
                    target(valueToWrite);
                } else {
                    if (newValue !== current) {
                        target.notifySubscribers(valueToWrite);
                    }
                }
            }
        });

        result(target());

        return result;
    };

    class AppViewModel {
        myNumberOne: ko.Observable<number>;
        myNumberTwo: ko.Observable<number>;
        
        constructor(one: number, two: number) {
            this.myNumberOne = ko.observable(one).extend({ numeric: 0 });
            this.myNumberTwo = ko.observable(two).extend({ numeric: 2 });
        }
    }

    ko.applyBindings(new AppViewModel(221.2234, 123.4525));

    ko.extenders.required = function (target: any, overrideMessage) {

        target.hasError = ko.observable();
        target.validationMessage = ko.observable();

        function validate(newValue) {
            target.hasError(newValue ? false : true);
            target.validationMessage(newValue ? "" : overrideMessage || "This field is required");
        }

        validate(target());

        target.subscribe(validate);

        return target;
    };

    class AppViewModel2 {
        firstName: ko.Observable<string>;
        lastName: ko.Observable<string>;
        
        constructor(first, last) {
            this.firstName = ko.observable(first).extend({ required: "Please enter a first name" });
            this.lastName = ko.observable(last).extend({ required: "" });
        }
    }

    ko.applyBindings(new AppViewModel2("Bob", "Smith"));

    const first: string = "test";
    this.firstName = ko.observable(first).extend({ required: "Please enter a first name", logChange: "first name" });

    const upperCaseName = ko.computed(() => name.toUpperCase()).extend({ throttle: 500 });

    class AppViewModel3 {
        public instantaneousValue = ko.observable();
        public throttledValue = ko.computed(this.instantaneousValue)
                                .extend({ throttle: 400 });

        public loggedValues = ko.observableArray([]);
        
        public throttledValueLogger = ko.computed(function (val) {
            if (val !== '')
                this.loggedValues.push(val);
        });
    }

    class GridViewModel {
        public pageSize = ko.observable(20);
        public pageIndex = ko.observable(1);
        public currentPageData = ko.observableArray();
        
        constructor() {
            
            ko.computed(() => {
                const params = { page: this.pageIndex(), size: this.pageSize() };
                $.getJSON('/Some/Json/Service', params, this.currentPageData);
            });
        }
    }
    
    this.setPageSize = function (newPageSize) {
        this.pageSize(newPageSize);
        this.pageIndex(1);
    };

    ko.computed(() => {
        var params = { page: this.pageIndex(), size: this.pageSize() };
        $.getJSON('/Some/Json/Service', params, this.currentPageData);
    }).extend({ throttle: 1 });

    document.querySelector(".remove").addEventListener("click", () => {
        viewModel.pets.remove(ko.dataFor(this));
    });
    
    document.querySelector(".remove").addEventListener("click", () => {
        viewModel.pets.remove(ko.dataFor(this));
    });

    ko.observableArray.fn.filterByProperty = function (propName, matchValue) {
        return ko.pureComputed(() => {
            const allItems = this(), matchingItems = [];
            for (let current of allItems) {
                if (ko.utils.unwrapObservable(current[propName]) === matchValue)
                    matchingItems.push(current);
            }
            return matchingItems;
        });
    }
    
    class Task {
        public title: ko.Observable<string>;
        public done: ko.Observable<boolean>;
        
        constructor(title: string, done: boolean) {
            this.title = ko.observable(title);
            this.done = ko.observable(done);
        }
    }

    class AppViewModel4 {
        public tasks = ko.observableArray([
            new Task('Find new desktop background', true),
            new Task('Put shiny stickers on laptop', false),
            new Task('Request more reggae music in the office', true)
        ]);

        public doneTasks = this.tasks.filterByProperty("done", true);
    }

    ko.applyBindings(new AppViewModel4());
    this.doneTasks = ko.computed(() => {
        const all = this.tasks(), done = [];
        for (let cur of all)
            if (cur.done())
                done.push(cur);
        return done;
    }, this);
}

// Define your own functions
declare module "knockout" {
    export interface Subscribable<T> {
        publishOn(topic: string): this;
        subscribeTo(topic: string): this;
    }

    export interface BindingHandlers {
        isolatedOptions: BindingHandler;
    }
}

function test_misc() {
    // define dummy vars
    let callback: any;
    let target: any;
    let topic: any;
    let vm: any;
    let value: any;

    const postbox = new ko.subscribable();
    postbox.subscribe(callback, target, topic);

    postbox.subscribe(function (newValue) {
        this.latestTopic(newValue);
    }, vm, "mytopic");
    
    postbox.notifySubscribers(value, "mytopic");

    ko.subscribable.fn.publishOn = function (topic) {
        this.subscribe(function (newValue) {
            postbox.notifySubscribers(newValue, topic);
        });

        return this;
    };

    this.myObservable = ko.observable("myValue").publishOn("myTopic");

    ko.subscribable.fn.subscribeTo = function (topic) {
        postbox.subscribe(this, null, topic);
        return this;
    };

    this.observableFromAnotherVM = ko.observable().subscribeTo("myTopic");

    postbox.subscribe(function (newValue) {
        this(newValue);
    }, this, topic);

    ko.bindingHandlers.isolatedOptions = {
        init: function (element, valueAccessor) {
            var args = arguments;
            ko.computed({
                read: () => {
                    ko.utils.unwrapObservable(valueAccessor());
                    ko.bindingHandlers.options.update.apply(this, args);
                },
                owner: this,
                disposeWhenNodeIsRemoved: element
            });
        }
    };

    ko.subscribable.fn.publishOn = function (topic) {
        this.subscribe(function (newValue) {
            postbox.notifySubscribers(newValue, topic);
        });

        return this;
    };

    this.myObservable = ko.observable("myValue").publishOn("myTopic");

    var x = ko.observableArray([1, 2, 3]);

    let element;
    ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
        $(element).datepicker("destroy");
    });
	
	this.observableFactory = function(readonly: boolean = false): ko.Subscribable<number>{
	    if (readonly) {
			return ko.computed(() => 3);
		} else {
			return ko.observable(3);
		}
	}
	
}

// Define your own bindingHandler
declare module "knockout" {
    export interface BindingHandlers {
        allBindingsAccessorTest: BindingHandler;
    }
}

function test_allBindingsAccessor() {
    ko.bindingHandlers.allBindingsAccessorTest = {
        init: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) => {
            var allBindings = allBindingsAccessor();
            var hasBinding = allBindingsAccessor.has("myBindingName");
            var myBinding = allBindingsAccessor.get("myBindingName");
            var fnAccessorBinding = allBindingsAccessor().myBindingName;
        },
        update: (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) => {
            var allBindings = allBindingsAccessor();
            var hasBinding = allBindingsAccessor.has("myBindingName");
            var myBinding = allBindingsAccessor.get("myBindingName");
            var fnAccessorBinding = allBindingsAccessor().myBindingName;
        }
    };
}


function test_Components() {

    // test all possible ko.components.register() overloads
    function test_Register() {
        // reused parameters
        const nodeArray = [new Node, new Node];
        const singleNode = new Node;
        const viewModelFn = function (params: any) { return <any>null; }
        class ViewModelClass {}

        // ------- viewmodel overloads:

        // viewModel as inline function (commonly used in examples)
        ko.components.register("name", { template: "string-template", viewModel: viewModelFn });

        // viewModel as a Class
        ko.components.register("name", { template: "string-template", viewModel: ViewModelClass });

        // viewModel from shared instance
        ko.components.register("name", { template: "string-template", viewModel: { instance: null } });

        // viewModel from createViewModel factory method
        ko.components.register("name", { template: "string-template", viewModel: { createViewModel: function (params: any, componentInfo: ko.components.ComponentInfo) { return null; } } });

        // viewModel from an AMD module 
        ko.components.register("name", { template: "string-template", viewModel: { require: "module" } });

        // ------- template overloads

        // template from named element
        ko.components.register("name", { template: { element: "elementID" }, viewModel: viewModelFn });
        
        // template using single Node
        ko.components.register("name", { template: { element: singleNode }, viewModel: viewModelFn });
        
        // template using Node array
        ko.components.register("name", { template: nodeArray, viewModel: viewModelFn });
        
        // template using an AMD module 
        ko.components.register("name", { template: { require: "text!module" }, viewModel: viewModelFn });

        // Empty config for registering custom elements that are handled by name convention
        ko.components.register('name', { /* No config needed */ });
    }
}


function testUnwrapUnion() {
    let possibleObs: ko.Observable<number> | number;
    const num = ko.unwrap(possibleObs);
}