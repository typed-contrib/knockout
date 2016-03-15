
const observable = ko.observable("test");
const computed = ko.computed<string>({
    read: observable,
    write: (val: string) => {
        observable(val);
    }
});

const val = ko.unwrap(computed);

computed.dispose();

ko.tasks.schedule(() => observable("test2"));