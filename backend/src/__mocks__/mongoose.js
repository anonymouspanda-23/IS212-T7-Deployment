// __mocks__/mongoose.js
const mongoose = jest.genMockFromModule("mongoose");

let mockData = {};

function CounterModel(data) {
  this._id = data._id;
  this.seq = data.seq;
}

CounterModel.prototype.save = jest.fn(async function () {
  mockData[this._id] = { _id: this._id, seq: this.seq };
  return this;
});

CounterModel.findById = jest.fn((id) => {
  return Promise.resolve(mockData[id] || null);
});

CounterModel.findByIdAndUpdate = jest.fn((id, update, options) => {
  if (mockData[id]) {
    mockData[id].seq += 1;
    return Promise.resolve(mockData[id]);
  } else {
    mockData[id] = { _id: id, seq: 1 };
    return Promise.resolve(mockData[id]);
  }
});

CounterModel.create = jest.fn((data) => {
  mockData[data._id] = data;
  return Promise.resolve(data);
});

mongoose.model = jest.fn(() => CounterModel);

module.exports = mongoose;
